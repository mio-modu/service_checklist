import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경변수가 없으면 null — 화면은 그대로 뜨고 "저장 안 됨" 배너만 보입니다. */
export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export const isConfigured = !!supabase;
