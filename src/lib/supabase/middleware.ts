import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // BỎ QUA kiểm tra API/auth nếu là request tài nguyên hoặc static
  if (path.startsWith('/_next') || path.startsWith('/assets') || path.startsWith('/favicon.ico')) {
    return supabaseResponse;
  }

  // Lấy session nhanh từ cookie local để tránh nghẽn mạng roundtrip
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // 1. Kiểm tra luồng truy cập /play (Người chơi)
  if (path.startsWith('/play')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Kiểm tra luồng truy cập /admin (Quản trị viên)
  if (path.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirectedFrom', path);
      return NextResponse.redirect(loginUrl);
    }

    // Role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const playUrl = request.nextUrl.clone();
      playUrl.pathname = '/play';
      playUrl.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(playUrl);
    }
  }

  // 3. Nếu đã đăng nhập mà truy cập trang auth (/login, /register) -> Chuyển về /play
  if ((path === '/login' || path === '/register') && user) {
    const playUrl = request.nextUrl.clone();
    playUrl.pathname = '/play';
    return NextResponse.redirect(playUrl);
  }

  return supabaseResponse;
}
