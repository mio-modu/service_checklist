-- ============================================================
--  예배 PD 체크리스트 — Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 실행하세요.
--  (여러 번 실행해도 안전합니다)
-- ============================================================

-- ── 1. 주차 정보 (설교 제목·본문·특별순서 플래그) ──────────────
create table if not exists public.weeks (
  week        date primary key,          -- 그 주 토요일 날짜 (주차 키)
  title       text default '',           -- 설교 제목
  scripture   text default '',           -- 설교 본문
  reading     text default '',           -- 공동체 성경읽기
  videos      text default '',           -- 금주 행사 · 기타 영상
  promo_note  text default '',           -- 홍보 영상 내용
  notice      text default '',           -- PD 전달사항
  flags       jsonb default '{}'::jsonb, -- 특별순서 on/off
  flag_svcs   jsonb default '{}'::jsonb, -- 특정 예배에서만 하는 순서가 붙는 예배 {"baptism":["s2"]}
  updated_at  timestamptz default now()
);

-- ── 2. 예배별 체크 상태 ────────────────────────────────────
create table if not exists public.checks (
  week         date not null,
  svc          text not null,              -- sat / s1 / s2 / s3 / j1 / j2 / j3
  service_date date,
  pd           text default '',            -- 담당 PD 이름
  items        jsonb default '{}'::jsonb,  -- {"a1":true,"b2":true}
  checked_at   jsonb default '{}'::jsonb,  -- {"a1":"2026-10-17T09:42:00Z"}
  prayer_min   int,                        -- 대표기도자 도착 (예배 n분 전)
  team_min     int,                        -- 예배 전 함께 기도 (n분 전)
  closing      jsonb,                      -- {status:'none'|'has', text, at, pd}
  updated_at   timestamptz default now(),
  primary key (week, svc)
);

-- ── 3. 기록 누적 (특이사항 · 이슈 · 마감보고) ────────────────
create table if not exists public.logs (
  id           uuid primary key default gen_random_uuid(),
  week         date not null,
  svc          text not null,
  svc_name     text default '',
  service_date date,
  kind         text not null,              -- special | issue | closing
  body         text not null,
  pd           text default '',
  created_at   timestamptz default now()
);
create index if not exists logs_created_idx on public.logs (created_at desc);
create index if not exists logs_week_idx    on public.logs (week);
-- 마감보고는 예배당 1건만 유지 (다시 작성 시 덮어쓰기)
create unique index if not exists logs_closing_uniq
  on public.logs (week, svc) where kind = 'closing';

-- ── 4. 전역 설정 (세례식 시행 월 등) ────────────────────────
create table if not exists public.config (
  key   text primary key,
  value jsonb not null
);
insert into public.config (key, value)
values ('rules', '{"baptismMonths":[2,4,6,10,12]}'::jsonb)   -- 세례식 시행 월 (11월 없음)
on conflict (key) do nothing;

-- ── 5. updated_at 자동 갱신 ────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists weeks_touch  on public.weeks;
create trigger weeks_touch  before update on public.weeks
  for each row execute function public.touch_updated_at();

drop trigger if exists checks_touch on public.checks;
create trigger checks_touch before update on public.checks
  for each row execute function public.touch_updated_at();

-- ── 6. 접근 정책 ───────────────────────────────────────────
-- 교회 내부용 도구이고 PD들이 로그인 없이 링크로 쓰기 때문에
-- anon(익명) 키에 읽기·쓰기를 허용합니다. 링크 자체가 접근 통제입니다.
-- 외부에 공개하지 마세요. 더 조이려면 README 의 '보안 한 단계 올리기' 참고.
alter table public.weeks  enable row level security;
alter table public.checks enable row level security;
alter table public.logs   enable row level security;
alter table public.config enable row level security;

drop policy if exists weeks_all  on public.weeks;
drop policy if exists checks_all on public.checks;
drop policy if exists logs_all   on public.logs;
drop policy if exists config_all on public.config;

create policy weeks_all  on public.weeks  for all using (true) with check (true);
create policy checks_all on public.checks for all using (true) with check (true);
create policy logs_all   on public.logs   for all using (true) with check (true);
create policy config_all on public.config for all using (true) with check (true);

-- ── 7. 실시간 중계 켜기 ────────────────────────────────────
-- (이미 등록된 테이블은 건너뜁니다 — 여러 번 실행해도 에러 없음)
do $$
declare t text;
begin
  foreach t in array array['checks','logs','weeks','config'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
