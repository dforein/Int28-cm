import { json, err, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!user) return err('User not found', 404);
  return json(user);
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;
  const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(id).first();
  if (!user) return err('User not found', 404);

  await env.DB.prepare('DELETE FROM edges WHERE user_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM nodes WHERE user_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM graph_visits WHERE user_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

  return json({ ok: true });
};
