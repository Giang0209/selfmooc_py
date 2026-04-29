// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Lấy thẻ "session" (JWT Cookie) mà chúng ta đã cấp lúc đăng nhập
  const session = request.cookies.get('session')?.value;

  // 2. Lấy đường dẫn người dùng đang muốn vào (ví dụ: '/', '/login', '/courses')
  const { pathname } = request.nextUrl;

  // Danh sách các trang KHÔNG CẦN đăng nhập (Public routes)
  const isPublicRoute = pathname === '/login' || pathname === '/register';

  // LUẬT SỐ 1: Chưa có thẻ (chưa đăng nhập) mà dám vào trang kín (như trang chủ '/')
  // -> Lập tức "đá" sang trang /login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // LUẬT SỐ 2: Đã có thẻ rồi (đã đăng nhập) mà lại mò ra trang /login nữa
  // -> "Đá" ngược lại vào trang chủ '/' (hoặc dashboard)
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nếu hợp lệ hết thì mời qua cửa bình thường
  return NextResponse.next();
}

// Cấu hình: Bác bảo vệ sẽ đứng canh ở NHỮNG ĐƯỜNG DẪN NÀO?
export const config = {
  // Biểu thức chính quy này có nghĩa là: 
  // Chạy Middleware ở MỌI TRANG, NGOẠI TRỪ các file ảnh, file hệ thống của Next.js, API...
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)',
  ],
};