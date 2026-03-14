import { json, err, uuid, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, name, color, created_at FROM users ORDER BY created_at DESC'
  ).all();
  return json({ users: results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { name?: string; color?: string };
  if (!body.name || !body.color) return err('name and color required');

  const id = uuid();
  const now = Date.now();

  await env.DB.prepare(
    'INSERT INTO users (id, name, color, created_at) VALUES (?, ?, ?, ?)'
  ).bind(id, body.name.trim(), body.color, now).run();

  return json({ id, name: body.name.trim(), color: body.color, created_at: now });
};
