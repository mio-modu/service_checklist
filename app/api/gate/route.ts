import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PIN 검증. PIN 은 서버 환경변수에만 있고 브라우저로 내려가지 않습니다.
 * 통과하면 httpOnly 쿠키로 역할을 심습니다.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pin = String(body?.pin ?? '').trim();

  const staffPin = (process.env.STAFF_PIN ?? '').trim();
  const adminPin = (process.env.ADMIN_PIN ?? '').trim();

  if (!staffPin && !adminPin) {
    return NextResponse.json({ ok: false, reason: 'unset' }, { status: 503 });
  }
  if (!pin) {
    return NextResponse.json({ ok: false, reason: 'empty' }, { status: 400 });
  }

  let role: 'admin' | 'staff' | null = null;
  if (adminPin && pin === adminPin) role = 'admin';
  else if (staffPin && pin === staffPin) role = 'staff';

  if (!role) {
    return NextResponse.json({ ok: false, reason: 'wrong' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set('sc_role', role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 60, // 60일. 폰에서 매번 치지 않도록.
  });
  return res;
}

/** 로그아웃 — 쿠키 지우기 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sc_role', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
