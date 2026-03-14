import { json, err, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;

  const graph = await env.DB.prepare('SELECT * FROM graphs WHERE id = ?').bind(id).first();
  if (!graph) return err('Graph not found', 404);

  const { results: nodes } = await env.DB.prepare(
    'SELECT * FROM nodes WHERE graph_id = ? ORDER BY created_at ASC'
  ).bind(id).all();

  const { results: edges } = await env.DB.prepare(
    'SELECT * FROM edges WHERE graph_id = ?'
  ).bind(id).all();

  const userIds = [...new Set(nodes.map((n) => (n as { user_id: string }).user_id))];
  let userColors: Record<string, string> = {};
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    const { results: users } = await env.DB.prepare(
      `SELECT id, color FROM users WHERE id IN (${placeholders})`
    ).bind(...userIds).all();
    users.forEach((u) => {
      userColors[(u as { id: string; color: string }).id] = (u as { id: string; color: string }).color;
    });
  }

  return json({ graph, nodes, edges, userColors });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;
  const graph = await env.DB.prepare('SELECT id FROM graphs WHERE id = ?').bind(id).first();
  if (!graph) return err('Graph not found', 404);

  // Delete in order: edges → nodes → graph_visits → graph
  await env.DB.prepare('DELETE FROM edges WHERE graph_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM nodes WHERE graph_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM graph_visits WHERE graph_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM graphs WHERE id = ?').bind(id).run();

  return json({ ok: true });
};
