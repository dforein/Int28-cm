import { json, err, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = params.id as string;

  const graph = await env.DB.prepare('SELECT id FROM graphs WHERE id = ?').bind(id).first();
  if (!graph) return err('Graph not found', 404);

  const { results: nodes } = await env.DB.prepare(
    'SELECT id, user_id, pos_x, pos_y, layer FROM nodes WHERE graph_id = ?'
  ).bind(id).all();

  const { results: edges } = await env.DB.prepare(
    'SELECT source_node_id, target_node_id FROM edges WHERE graph_id = ?'
  ).bind(id).all();

  const userIds = [...new Set(nodes.map((n) => (n as { user_id: string }).user_id))];
  let userColors: Record<string, string> = {};
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => '?').join(',');
    const { results: users } = await env.DB.prepare(
      `SELECT id, color FROM users WHERE id IN (${placeholders})`
    ).bind(...userIds).all();
    users.forEach((u) => {
      const uu = u as { id: string; color: string };
      userColors[uu.id] = uu.color;
    });
  }

  return json({ nodes, edges, userColors });
};
