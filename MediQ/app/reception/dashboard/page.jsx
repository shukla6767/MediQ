"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";
import { useQueueSocket } from "@/hooks/useQueueSocket";

export default function ReceptionDashboardPage() {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [stats, setStats] = useState({
    waiting: 0,
    called: 0,
    completed: 0,
    emergencyCount: 0,
  });
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [inProgressTokens, setInProgressTokens] = useState([]);
  const [emergencyTokens, setEmergencyTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    apiClient.get("/hospitals")
      .then(({ data }) => setHospitals(data.data || []))
      .catch(() => toast.error("Failed to load hospitals"));
  }, []);

  // Load departments when hospital changes
  useEffect(() => {
    if (!selectedHospital) { setDepartments([]); setSelectedDepartment(""); return; }
    apiClient.get("/hospitals/departments")
      .then(({ data }) => {
        const depts = (data.data || []).filter(
          (d) => String(d.hospital?._id || d.hospital) === selectedHospital
        );
        setDepartments(depts);
        setSelectedDepartment(depts.length === 1 ? depts[0]._id : "");
      })
      .catch(() => toast.error("Failed to load departments"));
  }, [selectedHospital]);

  // Fetch queue data
  const fetchDashboardData = useCallback(async () => {
    if (!selectedHospital || !selectedDepartment) return;

    setIsLoading(true);
    try {
      const [queueRes, statsRes] = await Promise.all([
        apiClient.get(`/queue/department?hospitalId=${selectedHospital}&departmentId=${selectedDepartment}`),
        apiClient.get(`/queue/stats?hospitalId=${selectedHospital}&departmentId=${selectedDepartment}`)
      ]);

      const queueData = queueRes.data.data.queue || [];
      const statsData = statsRes.data.data;

      const waiting = queueData.filter(t => t.status === "WAITING");
      const emergency = waiting.filter(t => t.priority === "EMERGENCY");
      const inProgress = queueData.filter(t => t.status === "CALLED");

      setWaitingTokens(waiting);
      setEmergencyTokens(emergency);
      setInProgressTokens(inProgress);

      setStats({
        waiting: statsData.waiting || 0,
        called: statsData.called || 0,
        completed: statsData.completed || 0,
        emergencyCount: emergency.length,
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedHospital, selectedDepartment]);

  // Socket.io Integration
  useQueueSocket(selectedDepartment, (event, payload) => {
    console.log("Queue Event Received:", event, payload);
    // On any queue event, refresh the dashboard to ensure consistency
    // Future optimization: Update local state directly based on payload
    fetchDashboardData();
  });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <DashboardShell role="receptionist">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Reception <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted mt-1">Manage your patient queue in real-time.</p>
        </div>

        {/* Location Selector */}
        <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Hospital</label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="">-- Select Hospital --</option>
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedHospital || departments.length === 0}
              className="w-full bg-surface-hover border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedHospital || !selectedDepartment ? (
          <div className="bg-surface rounded-3xl border border-border p-12 text-center">
            <div className="text-5xl mb-4">🏥</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Select a Location</h3>
            <p className="text-muted text-sm">Please select a hospital and department to view the dashboard.</p>
          </div>
        ) : isLoading && waitingTokens.length === 0 ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-surface rounded-2xl"></div>
            <div className="h-64 bg-surface rounded-2xl"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                label="Waiting Patients"
                value={stats.waiting}
                gradient="from-blue-500 to-cyan-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                label="In Progress"
                value={stats.called}
                gradient="from-amber-500 to-orange-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                label="Emergency"
                value={stats.emergencyCount}
                gradient="from-red-500 to-rose-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                label="Completed Today"
                value={stats.completed}
                gradient="from-emerald-500 to-teal-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Queue */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">Current Queue Overview</h2>
                  <a href="/reception/queue" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1">
                    Manage Full Queue
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </div>

                <div className="space-y-3">
                  {/* Emergency patients first */}
                  {emergencyTokens.length > 0 &&
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-2">
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">🚨 Emergency Queue</p>
                      {emergencyTokens.map((token) =>
                    <div key={token._id} className="flex items-center justify-between bg-surface rounded-xl p-4 border border-red-500/10 mb-2 last:mb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-extrabold text-sm">
                              {token.tokenNumber}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{token.patientId?.name || "Unknown"}</p>
                            </div>
                          </div>
                          <StatusBadge status="high" />
                        </div>
                    )}
                    </div>
                  }

                  {/* Regular waiting */}
                  {waitingTokens.filter((t) => t.priority !== "EMERGENCY").slice(0, 5).map((token, i) =>
                  <div key={token._id} className="flex items-center justify-between bg-surface rounded-2xl border border-border p-4 hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-extrabold text-sm">
                          {token.tokenNumber}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{token.patientId?.name || "Unknown"}</p>
                          <p className="text-xs text-muted">Est. wait: {token.estimatedWait} mins</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted font-medium">Pos: {i + 1}</span>
                        <StatusBadge status={token.status} />
                      </div>
                    </div>
                  )}
                  {waitingTokens.length > 5 && (
                    <div className="text-center mt-2">
                      <span className="text-xs text-muted">+ {waitingTokens.length - 5} more patients waiting</span>
                    </div>
                  )}
                  {waitingTokens.length === 0 && (
                    <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                      <p className="text-muted text-sm">No patients waiting in queue.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Progress sidebar */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">In Progress</h2>
                {inProgressTokens.length === 0 ?
                <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                    <p className="text-muted text-sm">No patients currently being served.</p>
                  </div> :

                <div className="space-y-3">
                    {inProgressTokens.map((token) =>
                  <div key={token._id} className="bg-surface rounded-2xl border border-amber-500/20 p-4 border-l-4 border-l-amber-500">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                            {token.tokenNumber}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{token.patientId?.name || "Unknown"}</p>
                          </div>
                        </div>
                        <StatusBadge status="in-progress" size="md" />
                      </div>
                  )}
                  </div>
                }

                {/* Quick actions */}
                <div className="mt-6 bg-surface rounded-2xl border border-border p-5">
                  <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <a href="/reception/queue" className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-foreground rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      Go to Queue Management
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}