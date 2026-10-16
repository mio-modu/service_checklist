'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import {
  Check, Flags, Log, SvcId, DEFAULT_BAPTISM_MONTHS, emptyCheck, serviceDate, svcName,
} from './domain';

export type WeekInfo = {
  week: string; title: string; scripture: string; reading: string;
  videos: string; notice: string; flags: Partial<Flags>;
};

export const emptyWeekInfo = (week: string): WeekInfo => ({
  week, title: '', scripture: '', reading: '', videos: '', notice: '', flags: {},
});

/* ============================================================
   한 주 전체를 들고 있는 훅.
   checks / weekInfo / logs / baptismMonths 를 실시간으로 유지합니다.
   ============================================================ */
export function useWeekData(week: string) {
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [weekInfo, setWeekInfo] = useState<WeekInfo>(() => emptyWeekInfo(week));
  const [logs, setLogs] = useState<Log[]>([]);
  const [baptismMonths, setBaptismMonths] = useState<number[]>(DEFAULT_BAPTISM_MONTHS);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(!!supabase);

  /** 방금 내가 쓴 건 서버 응답으로 덮어쓰지 않도록 잠깐 잠근다 */
  const dirty = useRef<Record<string, number>>({});
  const markDirty = useCallback((k: string) => {
    dirty.current[k] = Date.now();
    setTimeout(() => { if (Date.now() - (dirty.current[k] ?? 0) >= 1200) delete dirty.current[k]; }, 1300);
  }, []);
  const isDirty = (k: string) => Date.now() - (dirty.current[k] ?? 0) < 1200;

  const loadAll = useCallback(async () => {
    if (!supabase) { setReady(true); setOnline(false); return; }
    const [c, w, l, cfg] = await Promise.all([
      supabase.from('checks').select('*').eq('week', week),
      supabase.from('weeks').select('*').eq('week', week).maybeSingle(),
      supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(400),
      supabase.from('config').select('value').eq('key', 'rules').maybeSingle(),
    ]);
    if (c.data) {
      const m: Record<string, Check> = {};
      c.data.forEach((r: any) => { m[r.svc] = normalize(r, week); });
      setChecks(prev => {
        const next = { ...m };
        Object.keys(prev).forEach(k => { if (isDirty(k)) next[k] = prev[k]; });
        return next;
      });
    }
    if (!isDirty('__week')) setWeekInfo(w.data ? { ...emptyWeekInfo(week), ...w.data, flags: w.data.flags ?? {} } : emptyWeekInfo(week));
    if (l.data) setLogs(l.data as Log[]);
    const months = (cfg.data?.value as any)?.baptismMonths;
    if (Array.isArray(months) && !isDirty('__rules')) setBaptismMonths(months);
    setOnline(true);
    setReady(true);
  }, [week]);

  useEffect(() => { setReady(false); loadAll(); }, [loadAll]);

  /* 실시간 — 누가 체크하면 바로 들어온다 */
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel(`pd-${week}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checks' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weeks' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, loadAll)
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [week, loadAll]);

  /* 상대시각("3분 전") 갱신용 */
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30_000); return () => clearInterval(t); }, []);

  const getCheck = useCallback(
    (id: SvcId) => checks[id] ?? emptyCheck(week, id),
    [checks, week],
  );

  /* ── 쓰기 ─────────────────────────────────────────────── */
  const saveTimers = useRef<Record<string, any>>({});

  /* 저장 직전에 최신 state 를 읽기 위한 거울 */
  const checksRef = useRef(checks);
  useEffect(() => { checksRef.current = checks; }, [checks]);
  const weekRef = useRef(weekInfo);
  useEffect(() => { weekRef.current = weekInfo; }, [weekInfo]);

  const patchCheck = useCallback((id: SvcId, patch: Partial<Check>, immediate = false) => {
    setChecks(prev => {
      const base = prev[id] ?? emptyCheck(week, id);
      return { ...prev, [id]: { ...base, ...patch } };
    });
    markDirty(id);
    clearTimeout(saveTimers.current[id]);
    const flush = async () => {
      if (!supabase) return;
      const row = { ...(checksRef.current[id] ?? emptyCheck(week, id)) };
      await supabase.from('checks').upsert({
        week, svc: id, service_date: serviceDate(week, id),
        pd: row.pd ?? '', items: row.items ?? {}, checked_at: row.checked_at ?? {},
        prayer_min: row.prayer_min, team_min: row.team_min, closing: row.closing,
      }, { onConflict: 'week,svc' });
    };
    if (immediate) flush(); else saveTimers.current[id] = setTimeout(flush, 400);
  }, [week, markDirty]);

  const patchWeek = useCallback((patch: Partial<WeekInfo>, immediate = false) => {
    setWeekInfo(prev => ({ ...prev, ...patch }));
    markDirty('__week');
    clearTimeout(saveTimers.current.__week);
    const flush = async () => {
      if (!supabase) return;
      const w = weekRef.current;
      await supabase.from('weeks').upsert({
        week, title: w.title ?? '', scripture: w.scripture ?? '', reading: w.reading ?? '',
        videos: w.videos ?? '', notice: w.notice ?? '', flags: w.flags ?? {},
      }, { onConflict: 'week' });
    };
    if (immediate) flush(); else saveTimers.current.__week = setTimeout(flush, 400);
  }, [week, markDirty]);

  const saveBaptismMonths = useCallback(async (months: number[]) => {
    setBaptismMonths(months); markDirty('__rules');
    if (!supabase) return;
    await supabase.from('config').upsert({ key: 'rules', value: { baptismMonths: months } }, { onConflict: 'key' });
  }, [markDirty]);

  const addLog = useCallback(async (id: SvcId, kind: 'special' | 'issue', body: string, pd: string) => {
    const row = {
      week, svc: id, svc_name: svcName(id), service_date: serviceDate(week, id),
      kind, body, pd, created_at: new Date().toISOString(),
    };
    setLogs(prev => [{ id: `tmp-${Date.now()}`, ...row } as Log, ...prev]);
    if (!supabase) return;
    await supabase.from('logs').insert(row);
  }, [week]);

  /** 마감 보고는 예배당 1건 — 다시 작성하면 덮어쓴다 */
  const saveClosingLog = useCallback(async (id: SvcId, body: string, pd: string, at: string) => {
    if (!supabase) return;
    await supabase.from('logs').delete().eq('week', week).eq('svc', id).eq('kind', 'closing');
    await supabase.from('logs').insert({
      week, svc: id, svc_name: svcName(id), service_date: serviceDate(week, id),
      kind: 'closing', body, pd, created_at: at,
    });
  }, [week]);

  const removeLog = useCallback(async (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    if (!supabase) return;
    await supabase.from('logs').delete().eq('id', id);
  }, []);

  return {
    ready, online, checks, getCheck, weekInfo, logs, baptismMonths,
    patchCheck, patchWeek, saveBaptismMonths, addLog, saveClosingLog, removeLog,
  };
}

function normalize(r: any, week: string): Check {
  return {
    week: r.week ?? week, svc: r.svc, service_date: r.service_date ?? null,
    pd: r.pd ?? '', items: r.items ?? {}, checked_at: r.checked_at ?? {},
    prayer_min: r.prayer_min ?? null, team_min: r.team_min ?? null,
    closing: r.closing ?? null, updated_at: r.updated_at,
  };
}
