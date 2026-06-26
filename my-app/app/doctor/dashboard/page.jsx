"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";
import { useQueueSocket } from "@/hooks/useQueueSocket";

export default function DoctorDashboardPage() {
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [queueData, setQueueData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

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
      const { data } = await apiClient.get(`/queue/doctor-queue?hospitalId=${selectedHospital}&departmentId=${selectedDepartment}`);
      setQueueData(data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch doctor queue");
    } finally {
      setIsLoading(false);
    }
  }, [selectedHospital, selectedDepartment]);

  // Socket.io Integration
  useQueueSocket(selectedDepartment, (event, payload) => {
    console.log("Doctor Queue Event Received:", event, payload);
    fetchDashboardData();
  });

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleComplete = async () => {
    if (!queueData?.calledToken) return;
    
    setIsActioning(true);
    try {
      await apiClient.patch(`/queue/token/${queueData.calledToken._id}/complete`);
      toast.success("Patient marked as completed");
      fetchDashboardData(); // Refresh queue
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to complete token");
    } finally {
      setIsActioning(false);
    }
  };

  const currentPatient = queueData?.calledToken;
  const waitingTokens = queueData?.waitingTokens || [];
  const completedCount = queueData?.completedToday || 0;
  const todayTotal = waitingTokens.length + (currentPatient ? 1 : 0) + completedCount;

  return (
    <DashboardShell role="doctor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Doctor <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted mt-1">Manage your assigned patients and consultation queue.</p>
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
            <div className="text-5xl mb-4">🩺</div>
            <h3 className="text-xl font-bold text-foreground mb-2">Select your assignment</h3>
            <p className="text-muted text-sm">Please select your hospital and department to view your patients.</p>
          </div>
        ) : isLoading && !queueData ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-surface rounded-2xl"></div>
            <div className="h-64 bg-surface rounded-2xl"></div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                label="Total Assigned Today"
                value={todayTotal}
                gradient="from-emerald-500 to-teal-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                label="Current Token"
                value={currentPatient?.tokenNumber || "—"}
                gradient="from-amber-500 to-orange-500" />
              
              <StatCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                label="Completed Today"
                value={completedCount}
                gradient="from-violet-500 to-purple-500"
                trend={{ value: `${todayTotal > 0 ? Math.round(completedCount / todayTotal * 100) : 0}% done`, positive: true }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Patient Card */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-bold text-foreground mb-4">Current Patient</h2>
                {currentPatient ? (
                  <div className="relative bg-surface rounded-3xl border border-border p-8 overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                        <div className="text-center">
                          <p className="text-white/70 text-[10px] font-semibold uppercase">Token</p>
                          <p className="text-xl font-extrabold">{currentPatient.tokenNumber}</p>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-foreground mb-1">{currentPatient.patientId?.name || "Unknown Patient"}</h3>
                        <p className="text-sm text-muted mb-4">Priority: {currentPatient.priority}</p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-surface-hover rounded-xl p-3">
                            <p className="text-xs text-muted">Token Number</p>
                            <p className="text-lg font-bold text-foreground">{currentPatient.tokenNumber}</p>
                          </div>
                          <div className="bg-surface-hover rounded-xl p-3">
                            <p className="text-xs text-muted">Called At</p>
                            <p className="text-lg font-bold text-foreground">
                              {currentPatient.calledAt ? new Date(currentPatient.calledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleComplete}
                          disabled={isActioning}
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {isActioning ? "Completing..." : "Mark as Complete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-3xl border border-border p-12 text-center">
                    <div className="text-5xl mb-4">👨‍⚕️</div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No Current Patient</h3>
                    <p className="text-muted text-sm">
                      {waitingTokens.length > 0 ?
                      `${waitingTokens.length} patients waiting. Reception will call the next patient.` :
                      "All patients have been seen. Great work today!"}
                    </p>
                  </div>
                )}
              </div>

              {/* Today's Patient List */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Waiting Queue <span className="text-muted font-normal">({waitingTokens.length})</span>
                </h2>
                <div className="space-y-2">
                  {waitingTokens.length === 0 && (
                    <div className="bg-surface rounded-2xl border border-border p-6 text-center">
                      <p className="text-sm text-muted">No more patients waiting.</p>
                    </div>
                  )}
                  {waitingTokens.map((token, i) => (
                    <div key={token._id} className={`flex items-center gap-3 bg-surface rounded-xl border border-border p-3 ${i === 0 ? "border-primary/30 bg-primary/5" : ""}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{token.patientId?.name || "Unknown Patient"}</p>
                        <p className="text-xs text-muted">{token.tokenNumber}</p>
                      </div>
                      <span className="text-xs text-muted">{token.priority === 'EMERGENCY' ? '🚨' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}