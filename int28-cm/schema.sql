-- int28-cm schema
-- Run: wrangler d1 execute int28-cm --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS graphs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  layer INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (graph_id) REFERENCES graphs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  graph_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'none', -- 'none' | 'forward' | 'backward' | 'both'
  label TEXT,
  layer INTEGER NOT NULL DEFAULT 0,
  source_handle TEXT,
  target_handle TEXT,
  FOREIGN KEY (graph_id) REFERENCES graphs(id),
  FOREIGN KEY (source_node_id) REFERENCES nodes(id),
  FOREIGN KEY (target_node_id) REFERENCES nodes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tracks first-visit per user per graph (for the "blind creation" flow)
CREATE TABLE IF NOT EXISTS graph_visits (
  user_id TEXT NOT NULL,
  graph_id TEXT NOT NULL,
  visited_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, graph_id)
);
