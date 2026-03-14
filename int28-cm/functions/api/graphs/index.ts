import { json, err, uuid, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM graphs ORDER BY created_at DESC'
  ).all();
  return json({ graphs: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { name?: string; created_by?: string };
  if (!body.name || !body.created_by) return err('name and created_by required');

  if (body.created_by !== env.ADMIN_USER_ID) return err('Forbidden', 403);

  const id = uuid();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO graphs (id, name, created_by, created_at) VALUES (?, ?, ?, ?)'
  ).bind(id, body.name.trim(), body.created_by, now).run();

  // Create central root node (layer 0, centered at origin)
  const rootNodeId = uuid();
  await env.DB.prepare(
    'INSERT INTO nodes (id, graph_id, user_id, title, body, pos_x, pos_y, layer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(rootNodeId, id, body.created_by, body.name.trim(), null, 0, 0, -1, now).run();

  return json({ id, name: body.name.trim(), created_by: body.created_by, created_at: now });
};
