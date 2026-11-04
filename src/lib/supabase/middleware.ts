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
        setAll(cookiesToSet) {
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

  // Quan trọng: getUser() gửi request xác thực an toàn lên Supabase Auth Server (tránh giả mạo JWT cookie client-side)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

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

    // Kiểm tra role từ bảng profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Không có quyền admin -> Đá về trang chơi game /play kèm thông báo từ chối
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
