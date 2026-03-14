import { json, err, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const graphId = params.id as string;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return err('userId required');

  const visit = await env.DB.prepare(
    'SELECT 1 FROM graph_visits WHERE user_id = ? AND graph_id = ?'
  ).bind(userId, graphId).first();

  return json({ visited: !!visit });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const graphId = params.id as string;
  const body = await request.json() as { userId?: string };
  if (!body.userId) return err('userId required');

  await env.DB.prepare(
    'INSERT OR IGNORE INTO graph_visits (user_id, graph_id, visited_at) VALUES (?, ?, ?)'
  ).bind(body.userId, graphId, Date.now()).run();

  return json({ ok: true });
};
