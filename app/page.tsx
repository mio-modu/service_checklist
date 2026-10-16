import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * 링크는 하나입니다. PIN 으로 심어둔 역할에 따라 자기 화면으로 보냅니다.
 *  - 관리자 PIN 을 넣은 기기 → 현황판
 *  - 간사 PIN 을 넣은 기기   → 금주 정보
 *  - 아무것도 없으면          → PD 체크 화면
 */
export default function Home() {
  const role = cookies().get('sc_role')?.value;
  if (role === 'admin') redirect('/board');
  if (role === 'staff') redirect('/staff');
  redirect('/check');
}
