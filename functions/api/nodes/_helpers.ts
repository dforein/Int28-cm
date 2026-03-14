export interface Env {
  DB: D1Database;
  ADMIN_USER_ID: string;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function err(msg: string, status = 400) {
  return new Response(msg, { status });
}

export function uuid() {
  return crypto.randomUUID();
}
