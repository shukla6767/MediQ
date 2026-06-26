"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://localhost:5000/api";

const STATUS_STYLES = {
  WAITING:   "bg-blue-500/10 text-blue-500",
  CALLED:    "bg-amber-500/10 text-amber-500",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
  SKIPPED:   "bg-orange-500/10 text-orange-500",
  CANCELLED: "bg-red-500/10 text-red-500",
};

export default function PatientTokensPage() {
  const [allTokens, setAllTokens] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokens = async () => {
    try {
      const { data } = await axios.get(`${API}/queue/my-tokens`, { withCredentials: true });
      setAllTokens(data.data || []);
    } catch (error) {
      toast.error("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleCancel = async (tokenId) => {
    try {
      await axios.patch(`${API}/queue/token/${tokenId}/cancel`, {}, { withCredentials: true });
      toast.success("Token cancelled successfully");
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel token");
    }
  };

  const tabs = [
    { key: "all",       label: "All",          count: allTokens.length },
    { key: "WAITING",   label: "Active",        count: allTokens.filter((t) => t.status === "WAITING").length },
    { key: "CALLED",    label: "Called",        count: allTokens.filter((t) => t.status === "CALLED").length },
    { key: "COMPLETED", label: "Completed",     count: allTokens.filter((t) => t.status === "COMPLETED").length },
    { key: "CANCELLED", label: "Cancelled",     count: allTokens.filter((t) => t.status === "CANCELLED").length },
  ];

  const filteredTokens = activeTab === "all" ? allTokens : allTokens.filter((t) => t.status === activeTab);

  return (
    <DashboardShell role="patient">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">My Tokens</h1>
            <p className="text-muted mt-1">View and track all your appointment tokens.</p>
          </div>
          <a href="/patient/book" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
            Book New Token
          </a>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                activeTab === tab.key ? "bg-primary/20 text-primary" : "bg-surface-hover text-muted"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Token List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-border p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-foreground mb-2">No tokens found</h3>
            <p className="text-muted text-sm">No tokens match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTokens.map((token) => (
              <div key={token._id} className="group bg-surface rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Token number */}
                  <div className="flex-shrink-0">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-extrabold text-lg ${STATUS_STYLES[token.status] || "bg-surface-hover text-muted"}`}>
                      {token.tokenNumber}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-bold text-foreground">{token.hospitalId?.name || "Hospital"}</h3>
                      {token.priority === "EMERGENCY" && (
                        <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">🚨 EMERGENCY</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1">{token.departmentId?.name || "Department"}</p>
                  </div>

                  {/* Meta & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted">Est. Wait</p>
                      <p className="font-semibold text-foreground">{token.estimatedWait} min</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted">Booked</p>
                      <p className="font-semibold text-foreground">
                        {new Date(token.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={token.status?.toLowerCase()} />
                    </div>
                    {token.status === "WAITING" && (
                      <button
                        onClick={() => handleCancel(token._id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}