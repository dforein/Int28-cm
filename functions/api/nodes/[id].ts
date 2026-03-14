import { json, err, type Env } from './_helpers';

export const onRequestPatch: PagesFunction<Env> = async ({ request, params, env }) => {
  const id = params.id as string;

  const node = await env.DB.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first() as
    { 
      id: string; 
      user_id: string; 
      title: string; 
      body: string | null; 
      pos_x: number; 
      pos_y: number; 
      graph_id: string; 
      layer: number; 
      created_at: number 
    } | null;
  if (!node) return err('Node not found', 404);

  const body = await request.json() as {
    title?: string;
    body?: string;
    pos_x?: number;
    pos_y?: number;
  };

  const title = body.title?.trim() ?? node.title;
  const nodeBody = 'body' in body ? (body.body?.trim() ?? null) : node.body;
  const pos_x = body.pos_x ?? node.pos_x;
  const pos_y = body.pos_y ?? node.pos_y;

  await env.DB.prepare(
    'UPDATE nodes SET title = ?, body = ?, pos_x = ?, pos_y = ? WHERE id = ?'
  ).bind(title, nodeBody, pos_x, pos_y, id).run();

  return json({ ...node, title, body: nodeBody, pos_x, pos_y });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;

  await env.DB.prepare('DELETE FROM edges WHERE source_node_id = ? OR target_node_id = ?').bind(id, id).run();
  await env.DB.prepare('DELETE FROM nodes WHERE id = ?').bind(id).run();

  return json({ ok: true });
};
