import { json, type Env } from './_helpers';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = request.headers.get('x-user-id');
  if (!userId || !env.ADMIN_USER_ID) return json({ isAdmin: false });
  return json({ isAdmin: userId === env.ADMIN_USER_ID });
};
