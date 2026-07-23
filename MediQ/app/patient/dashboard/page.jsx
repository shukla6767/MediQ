"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";
import { useQueueSocket } from "@/hooks/useQueueSocket";

/**
 * ============================================================================
 * PATIENT DASHBOARD PAGE
 * ============================================================================
 * What this file does:
 * The primary UI where a patient watches their queue status in real-time.
 * 
 * How Data Flows Here (The "SWR / WebSockets" Hybrid Pattern):
 * 1. INITIAL LOAD: Calls `fetchStatus()` via standard REST API to get the current state.
 * 2. SUBSCRIPTION: Uses `useQueueSocket` to listen to the specific department's channel.
 * 3. REAL-TIME EVENT: When the Receptionist clicks "Call Next" in their dashboard, 
 *    the backend emits an event. This component hears it, and IMMEDIATELY triggers 
 *    `fetchStatus()` again to pull the freshest data perfectly in sync!
 */
export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [tokenStatus, setTokenStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const { data } = await apiClient.get("/queue/status");
      setTokenStatus(data.data);
    } catch (error) {
      // Not an error — user just has no active token
      setTokenStatus({ hasActiveToken: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Use Socket.io to listen to the specific department the patient is waiting in
  const departmentId = tokenStatus?.hasActiveToken ? tokenStatus.department?._id || tokenStatus.department : null;

  useQueueSocket(departmentId, (event, payload) => {
    console.log("Patient Queue Event Received:", event, payload);
    // When the queue updates, re-fetch status to get exact position
    fetchStatus();
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCancelToken = async (tokenId) => {
    try {
      await apiClient.patch(`/queue/token/${tokenId}/cancel`);
      toast.success("Token cancelled");
      fetchStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel token");
    }
  };

  const currentUser = user || {};
  const hasToken = tokenStatus?.hasActiveToken;

  return (
    <DashboardShell role="patient">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">
              Welcome back, <span className="gradient-text">{currentUser.name?.split(" ")[0] || "Patient"}</span>
            </h1>
            <p className="text-muted mt-1">Here&apos;s your real-time queue status.</p>
          </div>
          <button
            onClick={fetchStatus}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
            title="Refresh"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>}
            label="Your Token"
            value={hasToken ? tokenStatus.yourToken : "N/A"}
            gradient="from-cyan-500 to-blue-500"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>}
            label="Now Called"
            value={hasToken ? (tokenStatus.currentCalledToken || "—") : "N/A"}
            gradient="from-amber-500 to-orange-500"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
            label="Patients Ahead"
            value={hasToken ? tokenStatus.patientsAhead : "N/A"}
            gradient="from-violet-500 to-purple-500"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
            label="Est. Wait (min)"
            value={hasToken ? tokenStatus.estimatedWait : "N/A"}
            gradient="from-emerald-500 to-teal-500"
          />
        </div>

        {/* Active Token Card */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Active Token</h2>
          {isLoading ? (
            <div className="bg-surface rounded-3xl border border-border p-12 flex justify-center">
              <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            </div>
          ) : hasToken ? (
            <div className="relative bg-surface rounded-3xl border border-border p-8 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
              {tokenStatus.priority === "EMERGENCY" && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-500">
                  🚨 EMERGENCY
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Token visual */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse-glow">
                    <div className="text-center">
                      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Token</p>
                      <p className="text-white text-3xl font-extrabold">{tokenStatus.yourToken}</p>
                    </div>
                  </div>
                </div>

                {/* Token details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{tokenStatus.hospital?.name}</h3>
                    <p className="text-muted text-sm">{tokenStatus.department?.name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted">Currently Called</p>
                      <p className="text-2xl font-extrabold text-amber-500">{tokenStatus.currentCalledToken || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Patients Ahead</p>
                      <p className="text-2xl font-extrabold text-foreground">{tokenStatus.patientsAhead}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Est. Wait</p>
                      <p className="text-2xl font-extrabold text-primary">{tokenStatus.estimatedWait} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={tokenStatus.yourStatus?.toLowerCase() || "waiting"} size="md" />
                    {tokenStatus.yourStatus === "WAITING" && (
                      <button
                        onClick={() => handleCancelToken(tokenStatus.tokenId)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer"
                      >
                        Cancel Token
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl border border-border p-12 text-center">
              <div className="text-5xl mb-4">🎫</div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Active Token</h3>
              <p className="text-muted text-sm mb-4">Book a token to get started with your appointment.</p>
              <a href="/patient/book" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg">
                Book Token
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}