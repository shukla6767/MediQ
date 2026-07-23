"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://localhost:5000/api";

function BookTokenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [isLoadingDepts, setIsLoadingDepts] = useState(false);
  const [bookedToken, setBookedToken] = useState(null);

  // Fetch all hospitals on mount
  useEffect(() => {
    axios.get(`${API}/hospitals`)
      .then(({ data }) => setHospitals(data.data || []))
      .catch(() => toast.error("Failed to load hospitals"))
      .finally(() => setIsLoadingHospitals(false));
  }, []);

  // Fetch departments when hospital is selected
  useEffect(() => {
    if (!selectedHospital) return;
    setIsLoadingDepts(true);
    axios.get(`${API}/hospitals/departments`)
      .then(({ data }) => {
        const depts = (data.data || []).filter(
          (d) => String(d.hospital?._id || d.hospital) === String(selectedHospital._id)
        );
        setDepartments(depts);
      })
      .catch(() => toast.error("Failed to load departments"))
      .finally(() => setIsLoadingDepts(false));
  }, [selectedHospital]);

  const handleConfirm = async () => {
    if (!selectedHospital || !selectedDepartment) return;
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/queue/book`,
        {
          hospitalId: selectedHospital._id,
          departmentId: selectedDepartment._id,
          priority: isEmergency ? "EMERGENCY" : "NORMAL",
        },
        { withCredentials: true }
      );
      setBookedToken(data.data);
      setStep(4);
      toast.success("Token booked successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book token");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Hospital" },
    { num: 2, label: "Department" },
    { num: 3, label: "Confirm" },
    { num: 4, label: "Token" },
  ];

  return (
    <DashboardShell role="patient">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Book a Token</h1>
          <p className="text-muted mt-1">Select a hospital and department to get your token.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  step >= s.num
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25"
                    : "bg-surface-hover text-muted border border-border"
                }`}>
                  {step > s.num
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    : s.num}
                </div>
                <p className={`text-xs mt-2 font-medium ${step >= s.num ? "text-primary" : "text-muted"}`}>{s.label}</p>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 rounded transition-colors duration-500 ${step > s.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Hospital */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-foreground mb-4">Select a Hospital</h2>
            {isLoadingHospitals ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                <div className="text-5xl mb-4">🏥</div>
                <h3 className="text-lg font-bold text-foreground mb-2">No hospitals available</h3>
                <p className="text-muted text-sm">Please ask your admin to add hospitals first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hospitals.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => { setSelectedHospital(h); setStep(2); }}
                    className={`text-left bg-surface rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
                      selectedHospital?._id === h._id ? "border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-foreground">{h.name}</h3>
                      <StatusBadge status={h.crowd || "low"} />
                    </div>
                    <p className="text-xs text-muted mb-2">{h.address}</p>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>⏱️ {h.waitTime || "—"}</span>
                      <span>⭐ {h.rating || 0}</span>
                      <span>🛏️ {h.availableBeds}/{h.totalBeds} beds</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Department */}
        {step === 2 && selectedHospital && (
          <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Select a Department</h2>
                <p className="text-sm text-muted">{selectedHospital.name}</p>
              </div>
              <button onClick={() => { setStep(1); setSelectedDepartment(null); }} className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer">
                Change Hospital
              </button>
            </div>

            {/* Emergency toggle */}
            <label className="flex items-center gap-3 mb-6 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} className="w-4 h-4 rounded accent-red-500 cursor-pointer" />
              <div>
                <p className="text-sm font-semibold text-red-500">🚨 Emergency</p>
                <p className="text-xs text-muted">Mark as emergency for priority queue — gets served before regular patients</p>
              </div>
            </label>

            {isLoadingDepts ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              </div>
            ) : departments.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-lg font-bold text-foreground mb-2">No departments found</h3>
                <p className="text-muted text-sm">This hospital has no departments set up yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {departments.map((dept) => (
                  <button
                    key={dept._id}
                    onClick={() => { setSelectedDepartment(dept); setStep(3); }}
                    className="text-left bg-surface rounded-2xl border-2 border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-foreground">{dept.name}</h3>
                      <StatusBadge status={dept.crowd || "low"} />
                    </div>
                    <div className="space-y-1 text-xs text-muted">
                      <div className="flex justify-between"><span>Avg Wait</span><span className="font-semibold text-foreground">{dept.avgConsultationTime || 5} min/patient</span></div>
                      <div className="flex justify-between"><span>In Queue</span><span className="font-semibold text-foreground">{dept.currentQueue || 0}</span></div>
                      <div className="flex justify-between"><span>Doctors</span><span className="font-semibold text-foreground">{dept.activeDoctors || 0}/{dept.doctorSlots || 1}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedHospital && selectedDepartment && (
          <div className="animate-fade-in-up">
            <h2 className="text-lg font-bold text-foreground mb-4">Confirm Booking</h2>
            <div className="bg-surface rounded-3xl border border-border p-8">
              <div className="space-y-4">
                {[
                  { label: "Hospital", value: selectedHospital.name },
                  { label: "Department", value: selectedDepartment.name },
                  { label: "Type", value: isEmergency ? "🚨 Emergency" : "Regular" },
                  { label: "Avg Wait per Patient", value: `${selectedDepartment.avgConsultationTime || 5} min` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="flex-1 py-3.5 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer">
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Booking...
                    </span>
                  ) : "Confirm & Book"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && bookedToken && (
          <div className="animate-fade-in-up text-center">
            <div className="bg-surface rounded-3xl border border-border p-12 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Token Booked!</h2>
              <p className="text-muted text-sm mb-6">Your appointment has been confirmed.</p>

              {bookedToken.priority === "EMERGENCY" && (
                <div className="mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-semibold text-red-500">
                  🚨 Emergency — You have priority in the queue
                </div>
              )}

              <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-xl shadow-primary/30 mb-6 animate-pulse-glow">
                <div className="text-center">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Your Token</p>
                  <p className="text-white text-4xl font-extrabold">{bookedToken.tokenNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface-hover rounded-xl p-3">
                  <p className="text-xs text-muted">Patients Ahead</p>
                  <p className="text-xl font-bold text-foreground">{bookedToken.patientsAhead}</p>
                </div>
                <div className="bg-surface-hover rounded-xl p-3">
                  <p className="text-xs text-muted">Est. Wait</p>
                  <p className="text-xl font-bold text-primary">{bookedToken.estimatedWait} min</p>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted mb-8">
                <p>{selectedHospital?.name}</p>
                <p>{selectedDepartment?.name}</p>
              </div>

              <div className="flex gap-3">
                <a href="/patient/tokens" className="flex-1 py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all text-center">
                  View Tokens
                </a>
                <a href="/patient/dashboard" className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent text-center">
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function BookTokenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>}>
      <BookTokenContent />
    </Suspense>
  );
}