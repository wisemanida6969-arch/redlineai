"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Loader2, Users, Activity, UserPlus, ShieldAlert } from "lucide-react";

interface DailyRow {
  day: string;
  activeUsers: number;
  events: Record<string, number>;
  totalEvents: number;
}
interface ActiveUserRow {
  userId: string;
  email: string | null;
  count: number;
  lastSeen: string;
  features: string[];
}
interface RecentEvent { email: string | null; event: string; at: string }
interface RecentUser {
  email: string; plan: string; created_at: string;
  scans_used: number; quote_used: number; agent_used: number; vendor_used: number; precedent_used: number;
}
interface Stats {
  windowDays: number;
  totalUsers: number;
  signupsToday: number;
  todayActiveUsers: number;
  eventTypes: string[];
  daily: DailyRow[];
  activeUsers: ActiveUserRow[];
  recentEvents: RecentEvent[];
  recentUsers: RecentUser[];
}

const EVENT_LABEL: Record<string, string> = {
  dashboard_visit: "대시보드 접속",
  analysis: "계약서 검토",
  quote_draft: "초안 정리",
  agent_message: "AI 에이전트",
  vendor_scan: "리스크 스캔",
  precedent_search: "판례 검색",
  precedent_detail: "판례 열람",
};

function label(event: string): string {
  return EVENT_LABEL[event] ?? event;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (r.status === 401) { window.location.href = "/auth/login?next=/admin"; return null; }
        if (r.status === 403) { setForbidden(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-2xl font-bold text-white mb-1">사용자 현황 (관리자)</h1>
        <p className="text-slate-500 text-sm mb-8">최근 {stats?.windowDays ?? 14}일 활동 기준 · 이 페이지는 관리자 계정에서만 보입니다.</p>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 py-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중…
          </div>
        ) : forbidden ? (
          <div className="bg-[#162035] border border-red-800/40 rounded-2xl p-8 text-center">
            <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">접근 권한이 없습니다</p>
            <p className="text-slate-400 text-sm">이 페이지는 관리자 계정 전용입니다.</p>
          </div>
        ) : !stats ? (
          <p className="text-slate-500 text-sm">데이터를 불러오지 못했습니다.</p>
        ) : (
          <div className="space-y-8">
            {/* ── Summary cards ── */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-[#162035] border border-[#2a3d5f] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2"><Users className="w-3.5 h-3.5" /> 총 가입자</div>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="bg-[#162035] border border-[#2a3d5f] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2"><Activity className="w-3.5 h-3.5" /> 오늘 활성 사용자</div>
                <p className="text-3xl font-bold text-white">{stats.todayActiveUsers}</p>
              </div>
              <div className="bg-[#162035] border border-[#2a3d5f] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2"><UserPlus className="w-3.5 h-3.5" /> 오늘 신규 가입</div>
                <p className="text-3xl font-bold text-white">{stats.signupsToday}</p>
              </div>
            </div>

            {/* ── Daily activity table ── */}
            <section>
              <h2 className="text-white font-bold text-lg mb-3">일별 접속·사용 현황</h2>
              <div className="bg-[#162035] border border-[#1e3050] rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-[#1e3050]">
                      <th className="text-left px-4 py-3 whitespace-nowrap">날짜</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">활성 사용자</th>
                      {stats.eventTypes.map((ev) => (
                        <th key={ev} className="text-right px-4 py-3 whitespace-nowrap">{label(ev)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...stats.daily].reverse().map((d) => (
                      <tr key={d.day} className="border-b border-[#1e3050]/50 last:border-0">
                        <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{d.day}</td>
                        <td className="px-4 py-2.5 text-right text-white font-semibold">{d.activeUsers || "–"}</td>
                        {stats.eventTypes.map((ev) => (
                          <td key={ev} className="px-4 py-2.5 text-right text-slate-400">{d.events[ev] ?? "–"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Active users ── */}
            <section>
              <h2 className="text-white font-bold text-lg mb-3">활동 사용자 (최근 {stats.windowDays}일)</h2>
              <div className="bg-[#162035] border border-[#1e3050] rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-[#1e3050]">
                      <th className="text-left px-4 py-3">이메일</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">활동 수</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">사용한 기능</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">마지막 활동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.activeUsers.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">아직 기록된 활동이 없습니다.</td></tr>
                    ) : stats.activeUsers.map((u) => (
                      <tr key={u.userId} className="border-b border-[#1e3050]/50 last:border-0">
                        <td className="px-4 py-2.5 text-slate-300">{u.email ?? u.userId.slice(0, 8)}</td>
                        <td className="px-4 py-2.5 text-right text-white font-semibold">{u.count}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {u.features.map((f) => (
                              <span key={f} className="text-[10px] text-slate-300 bg-[#0f1a2e] border border-[#1e3050] rounded px-1.5 py-0.5">{label(f)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{fmtTime(u.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Recent events ── */}
            <section>
              <h2 className="text-white font-bold text-lg mb-3">최근 활동 로그</h2>
              <div className="bg-[#162035] border border-[#1e3050] rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-[#1e3050]">
                      <th className="text-left px-4 py-3 whitespace-nowrap">시각</th>
                      <th className="text-left px-4 py-3">이메일</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">활동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentEvents.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">아직 기록된 활동이 없습니다.</td></tr>
                    ) : stats.recentEvents.map((e, i) => (
                      <tr key={i} className="border-b border-[#1e3050]/50 last:border-0">
                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{fmtTime(e.at)}</td>
                        <td className="px-4 py-2 text-slate-300">{e.email ?? "–"}</td>
                        <td className="px-4 py-2 text-slate-300">{label(e.event)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Recent signups ── */}
            <section>
              <h2 className="text-white font-bold text-lg mb-3">최근 가입자 (누적 사용량)</h2>
              <div className="bg-[#162035] border border-[#1e3050] rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-[#1e3050]">
                      <th className="text-left px-4 py-3">이메일</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">플랜</th>
                      <th className="text-left px-4 py-3 whitespace-nowrap">가입일</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">검토</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">초안</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">에이전트</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">스캔</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">판례</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.email + u.created_at} className="border-b border-[#1e3050]/50 last:border-0">
                        <td className="px-4 py-2.5 text-slate-300">{u.email}</td>
                        <td className="px-4 py-2.5 text-slate-400">{u.plan}</td>
                        <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{String(u.created_at).slice(0, 10)}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{u.scans_used ?? 0}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{u.quote_used ?? 0}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{u.agent_used ?? 0}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{u.vendor_used ?? 0}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400">{u.precedent_used ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
