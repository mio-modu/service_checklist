# 예배 PD 체크리스트

온누리교회 대전 — 예배 방송 PD가 예배 전에 점검하고, 관리자가 실시간으로 보는 체크리스트.

| 주소 | 누가 | 무엇 |
|---|---|---|
| `/` | 각 예배 PD | 예배 선택 → 체크 → 마감 보고 |
| `/board` | 관리자 | 실시간 현황 · 타임라인 · 누적 기록 |

체크하는 즉시 저장되고, `/board` 가 열려 있으면 **새로고침 없이** 그 자리에서 갱신됩니다.

---

## 1. Supabase 만들기 (5분)

1. [supabase.com](https://supabase.com) → **New project**
   - Region 은 **Northeast Asia (Seoul)** 를 고르세요. 한국에서 제일 빠릅니다.
   - Database Password 는 따로 적어두세요 (이 앱에선 안 쓰지만 분실하면 곤란합니다).
2. 프로젝트가 뜨면 왼쪽 **SQL Editor** → **New query**
3. 이 저장소의 `supabase/schema.sql` 을 **통째로 복사해 붙여넣고 Run**
   - 테이블 4개(`weeks` `checks` `logs` `config`)와 실시간 중계가 한 번에 설정됩니다.
   - 여러 번 실행해도 안전합니다.
4. 왼쪽 **Project Settings → API** 에서 두 값을 복사
   - `Project URL`
   - `anon` `public` 키 (⚠️ `service_role` 키는 **절대** 쓰지 마세요)

## 2. Vercel 에 올리기 (5분)

```bash
# 이 폴더에서
git init && git add -A && git commit -m "예배 PD 체크리스트"
# GitHub 에 빈 저장소를 하나 만들고
git remote add origin https://github.com/<아이디>/pd-checklist.git
git push -u origin main
```

1. [vercel.com](https://vercel.com) → **Add New → Project** → 방금 올린 저장소 선택
2. **Environment Variables** 에 두 개를 넣습니다 (Production·Preview·Development 전부 체크)

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 의 Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 의 anon public 키 |

3. **Deploy**. 설정은 건드릴 것이 없습니다 (Next.js 자동 인식).

> 환경변수를 **나중에** 넣었다면 Deployments → 맨 위 → `⋯` → **Redeploy** 를 눌러야 반영됩니다.
> 환경변수가 없으면 화면은 뜨지만 상단에 빨간 "저장되지 않습니다" 띠가 뜹니다.

배포가 끝나면 주소가 나옵니다. PD들에게는 `https://....vercel.app/`, 관리자는 `https://....vercel.app/board`.

### 로컬에서 돌려보기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:3000
```

---

## 3. 자동으로 정해지는 것들

주일 날짜만 보고 그 주 특별순서가 **저절로** 켜집니다. 관리자가 손댈 필요 없습니다.

| 순서 | 규칙 | 붙는 위치 |
|---|---|---|
| 성찬식 | 매월 **첫째 주** | 설교 직후 · 약 8분 |
| 비전헌금 영상 | 매월 **둘째 주** | 설교 종료 직후 |
| 세례식 | 해당 월 **마지막 주** (2·4·6·10·12월 — **11월 없음**) | 설교 후 |
| 홍보 영상 | **기본 꺼짐** — 그때그때 관리자가 켬 | 공동체 성경읽기 직후 |
| 1대1 / 어린이 1대1 수료식 | 비정기 — 관리자가 켬 | — |

꺼진 영상은 체크리스트에서 지워지지 않고 **「해당 없음 — 이번 주 홍보 영상 없음」** 회색 줄로 남습니다.
PD가 "왜 없지?" 하고 찾지 않게 하기 위해서입니다. 진행률 분모도 그 주 항목 수에 맞춰 바뀝니다.

**세례식 시행 월 바꾸기**: `/` 화면 → 금주 예배 정보 → **편집** → 1~12 숫자 버튼.
전체 공통 설정이라 한 번만 고치면 계속 적용됩니다.

## 4. 마감 보고

예배가 끝나면 **반드시** 제출해야 마감됩니다. 특이사항이 없어도 "특이사항 없음"으로 눌러야 합니다.

- 제출 전 → 현황판에 빨간 **「마감 보고 미제출」**, 상단 숫자 `마감 보고 2/4`
- 제출 후 → 초록 테두리로 내용이 현황판에 바로 올라감
- 모든 마감 보고는 **기록 누적**에 주차 무관하게 쌓입니다 (`마감 보고` 필터)

## 5. 체크 항목 고치기

`lib/domain.ts` **한 파일만** 고치면 두 화면에 동시에 반영됩니다.

- `SECTIONS` — 기본 체크 항목 (섹션당 8개 미만 유지)
- `SPECIALS` — 특별순서와 그때 붙는 항목
- `autoFlags()` — 몇째 주에 무엇이 켜지는가
- `SVCS` — 예배 목록과 시각

항목 `id`(`a1` `b2` …)는 **바꾸지 마세요**. 이미 저장된 기록이 그 id 로 붙어 있습니다.
새 항목은 쓰지 않은 id 를 새로 주면 됩니다.

---

## 보안에 대해

PD들이 로그인 없이 링크로 쓰기 때문에, Supabase `anon` 키에 읽기·쓰기를 허용해 뒀습니다.
**링크를 아는 사람이 곧 쓸 수 있는 사람**입니다. 교회 내부 단톡방 정도까지만 공유하세요.

한 단계 조이려면 둘 중 하나:

1. **Vercel 암호 걸기** — Project Settings → Deployment Protection → Password Protection.
   가장 쉽고, 링크 + 비밀번호 한 개면 끝납니다.
2. **Supabase Auth 매직링크** — PD 이메일만 등록해 두고 RLS 를 `auth.uid() is not null` 로 바꿉니다.
   제대로 된 방식이지만 PD가 매번 메일을 열어야 합니다.

`service_role` 키는 이 프로젝트 어디에도 넣지 마세요. 브라우저로 나가는 순간 DB 전체가 열립니다.

## 디자인 규칙

[webdesign-style](https://webdesign-style.vercel.app/) 의 FLAT 군에서 네 가지를 골라 조합했습니다.

| 코드 | 스타일 | 지킨 규칙 |
|---|---|---|
| T17 | 형광색 포스터 | 형광 한 색(`#C8FF3D`) + 검정 · 그라데이션 금지 |
| T25 | 잡지 펼침면 | 그림자 없음 · 구역은 선 하나로만 · 가운데 정렬 금지 |
| T14 | 처리 흐름도 | 상자는 얇은 선으로만 · 한 방향 · 섹션당 8단계 미만 |
| T20 | 숫자로 증명하기 | 숫자가 주인공 · 기준 시각을 같이 적기 |

방송실은 어둡기 때문에 **다크 전용**입니다. 형광 라임은 검정 위에서 대비 15:1 로, WCAG AA(4.5:1)를 크게 넘습니다.
경고용 빨강(`#FF5A45`)은 **미제출·필수 미완료 두 곳에만** 씁니다 — 이것 하나는 T17 의 "한 색" 규칙에서 의도적으로 벗어났습니다.
생방송 중에 놓치면 안 되는 신호라서입니다.

폰트는 Pretendard(본문) + JetBrains Mono(숫자·시각). 숫자는 전부 `tabular-nums` 로 자리가 맞습니다.
`prefers-reduced-motion` 을 켠 사용자에게는 모든 전환이 꺼집니다.
