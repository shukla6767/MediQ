"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function AdminStaffPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "doctor",
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admin/staff/register",
        formData,
        { withCredentials: true }
      );

      toast.success(`${formData.role === "doctor" ? "Doctor" : "Receptionist"} registered successfully!`);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "doctor",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to register staff");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Staff Management
          </h1>
          <p className="text-muted mt-1">
            Securely onboard new Doctors and Receptionists to the platform.
          </p>
        </div>

        {/* Add Staff Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20" />
          <div className="relative bg-surface rounded-3xl border border-border p-8 shadow-xl">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add New Staff Member
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Role</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "doctor", label: "Doctor", icon: "🩺" },
                    { id: "receptionist", label: "Receptionist", icon: "🏥" }
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => updateField("role", role.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.role === role.id
                          ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/10"
                          : "border-border text-muted hover:border-primary/30 hover:bg-surface-hover"
                      }`}
                    >
                      <span className="text-2xl mb-2">{role.icon}</span>
                      <span className="font-bold text-sm">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Jane Doe"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@hospital.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Temporary Password</label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    placeholder="Set a password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Registering Staff...
                  </span>
                ) : (
                  `Register ${formData.role === "doctor" ? "Doctor" : "Receptionist"}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
