"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import apiClient from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";

const activityIcons = {
  token: { bg: "bg-blue-500/10", text: "text-blue-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg> },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> },
  emergency: { bg: "bg-red-500/10", text: "text-red-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg> },
  login: { bg: "bg-violet-500/10", text: "text-violet-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg> },
  update: { bg: "bg-amber-500/10", text: "text-amber-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg> },
  skipped: { bg: "bg-orange-500/10", text: "text-orange-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
  cancelled: { bg: "bg-gray-500/10", text: "text-gray-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> },
  called: { bg: "bg-pink-500/10", text: "text-pink-500", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> }
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get("/hospitals/admin-stats"),
        apiClient.get("/hospitals/recent-activity")
      ]);
      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // ─── WEBSOCKET UPGRADE POINT ─────────────────────────────
    // Replace this setInterval with:
    // socket.on("stats:updated", () => fetchDashboardData());
    // ─────────────────────────────────────────────────────────
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mini chart data (Static for now, could be wired to historical API later)
  const queueTrend = [35, 42, 55, 48, 65, 72, 60];

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted mt-1">System-wide overview of all hospital operations.</p>
        </div>

        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-surface rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-surface rounded"></div>
                <div className="h-4 bg-surface rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                label="Total Patients"
                value={stats?.totalTokens || 0}
                gradient="from-cyan-500 to-blue-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>}
                label="Active Hospitals"
                value={stats?.hospitalsCount || 0}
                gradient="from-amber-500 to-orange-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                label="Avg Wait Time"
                value={`~${stats?.avgWaitTime || 0} min`}
                gradient="from-violet-500 to-purple-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                label="Doctors Active"
                value={stats?.doctorsCount || 0}
                gradient="from-emerald-500 to-teal-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue Trend Mini Chart */}
              <div className="lg:col-span-2 bg-surface rounded-3xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">Queue Trend</h2>
                  <span className="text-xs text-muted bg-surface-hover px-3 py-1.5 rounded-lg">Last 7 days</span>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {queueTrend.map((val, i) =>
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent/60 transition-all duration-500 hover:opacity-80"
                      style={{ height: `${val / Math.max(...queueTrend) * 100}%` }} />
                    
                      <span className="text-[10px] text-muted">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted">No recent activity.</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((item) => {
                      const config = activityIcons[item.type] || activityIcons.update;
                      return (
                        <div key={item.id} className="flex gap-3 bg-surface rounded-xl border border-border p-3 hover:border-primary/20 transition-all">
                          <div className={`p-2 rounded-lg ${config.bg} ${config.text} flex-shrink-0`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{item.action}</p>
                            <p className="text-xs text-muted truncate">{item.detail}</p>
                          </div>
                          <span className="text-[10px] text-muted whitespace-nowrap mt-1">
                            {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <a href="/admin/analytics" className="block text-center text-sm text-primary font-medium mt-4 hover:text-primary-dark transition-colors">
                  View All Analytics →
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
              { href: "/admin/hospitals", label: "Manage Hospitals", desc: `${stats?.hospitalsCount || 0} hospitals`, icon: "🏥", gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20" },
              { href: "/admin/departments", label: "Manage Departments", desc: `${stats?.departmentsCount || 0} departments`, icon: "🏢", gradient: "from-violet-500/10 to-purple-500/10 border-violet-500/20" },
              { href: "/admin/analytics", label: "View Analytics", desc: "Crowd trends & insights", icon: "📊", gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/20" }].
              map((link) =>
              <a key={link.href} href={link.href} className={`group bg-gradient-to-br ${link.gradient} rounded-2xl border p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                  <div className="text-3xl mb-3">{link.icon}</div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{link.label}</h3>
                  <p className="text-xs text-muted mt-1">{link.desc}</p>
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}