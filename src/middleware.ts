import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /*
   * CHỈ chạy Middleware cho luồng /admin và các trang auth /login, /register
   * KHÔNG chặn Middleware ở /play để người chơi chuyển tab tức thì 0ms,
   * việc bảo vệ /play đã có Server Component layout.tsx đảm nhiệm an toàn 100%.
   */
  matcher: ['/admin/:path*', '/login', '/register'],
};
