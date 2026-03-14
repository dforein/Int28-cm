import { json, err, uuid, type Env } from './_helpers';

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const graphId = params.id as string;
  const body = await request.json() as {
    source_node_id?: string;
    target_node_id?: string;
    user_id?: string;
    direction?: string;
    label?: string;
    layer?: number;
    source_handle?: string;
    target_handle?: string;
  };

  if (!body.source_node_id || !body.target_node_id || !body.user_id) {
    return err('source_node_id, target_node_id, user_id required');
  }

  const direction = body.direction ?? 'none';
  const id = uuid();

  await env.DB.prepare(
    'INSERT INTO edges (id, graph_id, source_node_id, target_node_id, user_id, direction, label, layer, source_handle, target_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, graphId,
    body.source_node_id, body.target_node_id,
    body.user_id, direction,
    body.label?.trim() ?? null,
    body.layer ?? 0,
    body.source_handle ?? null,
    body.target_handle ?? null,
  ).run();

  return json({
    id, graph_id: graphId,
    source_node_id: body.source_node_id,
    target_node_id: body.target_node_id,
    user_id: body.user_id,
    direction, label: body.label?.trim() ?? null,
    layer: body.layer ?? 0,
    source_handle: body.source_handle ?? null,
    target_handle: body.target_handle ?? null,
  });
};
