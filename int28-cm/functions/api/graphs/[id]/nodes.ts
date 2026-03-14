import { json, err, uuid, type Env } from './_helpers';

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const graphId = params.id as string;
  const body = await request.json() as {
    user_id?: string;
    title?: string;
    body?: string;
    pos_x?: number;
    pos_y?: number;
    layer?: number;
  };

  if (!body.user_id || !body.title) return err('user_id and title required');

  // Verify user exists
  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(body.user_id).first();
  if (!user) return err('User not found', 404);

  const id = uuid();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO nodes (id, graph_id, user_id, title, body, pos_x, pos_y, layer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, graphId, body.user_id,
    body.title.trim(),
    body.body?.trim() ?? null,
    body.pos_x ?? 0, body.pos_y ?? 0,
    body.layer ?? 0, now
  ).run();

  return json({ id, graph_id: graphId, user_id: body.user_id, title: body.title.trim(), body: body.body?.trim() ?? null, pos_x: body.pos_x ?? 0, pos_y: body.pos_y ?? 0, layer: body.layer ?? 0, created_at: now });
};
