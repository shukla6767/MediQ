"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://localhost:5000/api";

const PRIORITY_BADGE = {
  EMERGENCY: "bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full",
  NORMAL: "bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs px-2 py-0.5 rounded-full",
};

const STATUS_ROW_BG = {
  CALLED: "bg-amber-500/5 border-l-2 border-l-amber-500",
  EMERGENCY_WAITING: "bg-red-500/5",
};

export default function ReceptionQueuePage() {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    axios.get(`${API}/hospitals`)
      .then(({ data }) => setHospitals(data.data || []))
      .catch(() => toast.error("Failed to load hospitals"));
  }, []);

  // Load departments when hospital changes
  useEffect(() => {
    if (!selectedHospital) { setDepartments([]); setSelectedDepartment(""); return; }
    axios.get(`${API}/hospitals/departments`)
      .then(({ data }) => {
        const depts = (data.data || []).filter(
          (d) => String(d.hospital?._id || d.hospital) === selectedHospital
        );
        setDepartments(depts);
        setSelectedDepartment("");
      })
      .catch(() => toast.error("Failed to load departments"));
  }, [selectedHospital]);

  // Fetch queue for selected department
  const fetchQueue = useCallback(async () => {
    if (!selectedHospital || !selectedDepartment) return;
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/queue/department?hospitalId=${selectedHospital}&departmentId=${selectedDepartment}`,
        { withCredentials: true }
      );
      setQueue(data.data.queue || []);
      setStats(data.data.stats || null);
    } catch (error) {
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }, [selectedHospital, selectedDepartment]);

  // Auto-refresh every 10s (ready to replace with Socket.io subscription)
  useEffect(() => {
    fetchQueue();
    if (!selectedHospital || !selectedDepartment) return;
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const action = async (fn) => {
    setIsActioning(true);
    try {
      await fn();
      await fetchQueue();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setIsActioning(false);
    }
  };

  const handleCallNext = () =>
    action(async () => {
      const { data } = await axios.post(
        `${API}/queue/call-next`,
        { hospitalId: selectedHospital, departmentId: selectedDepartment },
        { withCredentials: true }
      );
      if (data.data) {
        toast.success(`Token ${data.data.tokenNumber} called!`);
      } else {
        toast.success("Queue is empty");
      }
    });

  const handleComplete = (tokenId) =>
    action(async () => {
      await axios.patch(`${API}/queue/token/${tokenId}/complete`, {}, { withCredentials: true });
      toast.success("Token completed");
    });

  const handleSkip = (tokenId) =>
    action(async () => {
      await axios.patch(`${API}/queue/token/${tokenId}/skip`, {}, { withCredentials: true });
      toast.success("Token skipped");
    });

  const waitingQueue = queue.filter((t) => t.status === "WAITING");
  const calledToken = queue.find((t) => t.status === "CALLED");
  const isReady = selectedHospital && selectedDepartment;

  return (
    <DashboardShell role="receptionist">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Queue Management</h1>
            <p className="text-muted mt-1">Call, skip, or complete patients in the queue.</p>
          </div>
          <button
            onClick={handleCallNext}
            disabled={!isReady || waitingQueue.length === 0 || isActioning}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Call Next Patient
          </button>
        </div>

        {/* Department Selector */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Select Department</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Hospital</label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="">-- Select Hospital --</option>
                {hospitals.map((h) => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-medium">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={!selectedHospital}
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!isReady ? (
          <div className="bg-surface rounded-3xl border border-border p-12 text-center">
            <div className="text-5xl mb-4">👆</div>
            <h3 className="text-lg font-bold text-foreground mb-2">Select a Department</h3>
            <p className="text-muted text-sm">Choose a hospital and department above to manage the queue.</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-500/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-blue-500">{stats.waiting}</p>
                  <p className="text-xs text-muted font-medium mt-1">Waiting</p>
                </div>
                <div className="bg-amber-500/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-amber-500">{stats.called}</p>
                  <p className="text-xs text-muted font-medium mt-1">In Progress</p>
                </div>
                <div className="bg-emerald-500/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-emerald-500">{stats.completed}</p>
                  <p className="text-xs text-muted font-medium mt-1">Completed</p>
                </div>
                <div className="bg-violet-500/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-violet-500">{stats.avgWaitTime} min</p>
                  <p className="text-xs text-muted font-medium mt-1">Est. Wait</p>
                </div>
              </div>
            )}

            {/* Currently Serving */}
            {calledToken && (
              <div className="relative bg-surface rounded-3xl border-2 border-amber-500/30 p-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                      {calledToken.tokenNumber}
                    </div>
                    <div>
                      <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider">Currently Serving</p>
                      <h3 className="text-xl font-bold text-foreground">{calledToken.patientId?.name || "Patient"}</h3>
                      <p className="text-sm text-muted">{calledToken.patientId?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSkip(calledToken._id)}
                      disabled={isActioning}
                      className="px-4 py-2 text-sm font-semibold text-muted rounded-xl border border-border hover:bg-surface-hover hover:text-foreground transition-all cursor-pointer disabled:opacity-50"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => handleComplete(calledToken._id)}
                      disabled={isActioning}
                      className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50"
                    >
                      Complete ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting Queue Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Waiting Queue <span className="text-muted font-normal">({waitingQueue.length})</span>
                </h2>
                <button onClick={fetchQueue} disabled={isLoading} className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer" title="Refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                </div>
              ) : waitingQueue.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Queue is empty!</h3>
                  <p className="text-muted text-sm">No more patients waiting.</p>
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover/50">
                        <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">#</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Token</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Patient</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Priority</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Wait</th>
                        <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {waitingQueue.map((token, i) => (
                        <tr
                          key={token._id}
                          className={`hover:bg-surface-hover/50 transition-colors ${token.priority === "EMERGENCY" ? "bg-red-500/5" : ""}`}
                        >
                          <td className="px-6 py-4 text-sm font-bold text-muted">{i + 1}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold ${token.priority === "EMERGENCY" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                              {token.tokenNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-foreground">{token.patientId?.name || "Patient"}</p>
                            <p className="text-xs text-muted">{token.patientId?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={PRIORITY_BADGE[token.priority]}>
                              {token.priority === "EMERGENCY" ? "🚨 Emergency" : "Regular"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted">{token.estimatedWait} min</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleSkip(token._id)}
                              disabled={isActioning}
                              className="p-2 rounded-lg text-muted hover:text-orange-500 hover:bg-orange-500/10 transition-colors cursor-pointer disabled:opacity-50"
                              title="Skip"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}