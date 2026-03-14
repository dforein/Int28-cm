import { json, err, type Env } from './_helpers';

export const onRequestPatch: PagesFunction<Env> = async ({ request, params, env }) => {
  const edgeId = params.edgeId as string;
  const graphId = params.id as string;

  const edge = await env.DB.prepare('SELECT * FROM edges WHERE id = ? AND graph_id = ?')
    .bind(edgeId, graphId).first() as {
      id: string; graph_id: string; source_node_id: string; target_node_id: string;
      user_id: string; direction: string; label: string | null; layer: number;
    } | null;
  if (!edge) return err('Edge not found', 404);

  const body = await request.json() as { direction?: string; label?: string };
  const direction = body.direction ?? edge.direction;
  const label = 'label' in body ? (body.label?.trim() ?? null) : edge.label;

  await env.DB.prepare('UPDATE edges SET direction = ?, label = ? WHERE id = ?')
    .bind(direction, label, edgeId).run();

  return json({ ...edge, direction, label });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const edgeId = params.edgeId as string;
  const graphId = params.id as string;

  const edge = await env.DB.prepare('SELECT id FROM edges WHERE id = ? AND graph_id = ?')
    .bind(edgeId, graphId).first();
  if (!edge) return err('Edge not found', 404);

  await env.DB.prepare('DELETE FROM edges WHERE id = ?').bind(edgeId).run();
  return json({ ok: true });
};
