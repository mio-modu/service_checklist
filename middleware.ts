import { NextResponse, type NextRequest } from 'next/server';

/**
 * /staff 와 /board 는 PIN 을 통과한 사람만 들어갑니다.
 * 쿠키는 httpOnly 라 브라우저 스크립트로 읽거나 고칠 수 없고,
 * PIN 자체는 서버 환경변수에만 있어 화면 소스에 노출되지 않습니다.
 */
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const need: 'admin' | 'staff' | null =
    path.startsWith('/board') ? 'admin' : path.startsWith('/staff') ? 'staff' : null;
  if (!need) return NextResponse.next();

  const role = req.cookies.get('sc_role')?.value;
  // 관리자는 간사 화면도 볼 수 있습니다.
  if (role === 'admin' || role === need) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/gate';
  url.search = `?to=${encodeURIComponent(path)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/staff/:path*', '/board/:path*'] };
