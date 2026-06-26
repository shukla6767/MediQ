"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

const API = "http://localhost:5000/api";

const ROLE_BADGE = {
  patient: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  doctor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  receptionist: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  admin: "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Seed profile form when user data is available
  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || "", phone: user.phone || "" });
    }
  }, [user]);

  // Real-time password strength
  useEffect(() => {
    const p = passwords.newPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    setPasswordStrength(score);
  }, [passwords.newPassword]);

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error("Name is required");

    setIsSavingProfile(true);
    try {
      const { data } = await axios.patch(
        `${API}/auth/me/update`,
        { name: profile.name.trim(), phone: profile.phone.trim() },
        { withCredentials: true }
      );
      // Update the global auth context so Navbar/Shell also refreshes
      if (setUser) setUser(data.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwords;

    if (newPassword !== confirmNewPassword) {
      return toast.error("New passwords do not match");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }

    setIsSavingPassword(true);
    try {
      await axios.patch(
        `${API}/auth/me/change-password`,
        { currentPassword, newPassword, confirmNewPassword },
        { withCredentials: true }
      );
      toast.success("Password changed successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: "security", label: "Security", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ];

  const PasswordInput = ({ label, field, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
      <div className="relative">
        <input
          type={showPasswords[field] ? "text" : "password"}
          required
          value={passwords[field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmNewPassword"]}
          onChange={(e) =>
            setPasswords((p) => ({
              ...p,
              [field === "current" ? "currentPassword" : field === "new" ? "newPassword" : "confirmNewPassword"]: e.target.value,
            }))
          }
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPasswords((p) => ({ ...p, [field]: !p[field] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          {showPasswords[field]
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
    </div>
  );

  return (
    <DashboardShell role={user?.role}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Profile Settings</h1>
          <p className="text-muted mt-1">Manage your personal information and account security.</p>
        </div>

        {/* Profile Card - Avatar / Info */}
        <div className="bg-surface rounded-3xl border border-border p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-extrabold text-2xl shadow-lg flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-foreground truncate">{user?.name || "User"}</h2>
              <p className="text-sm text-muted truncate">{user?.email}</p>
            </div>
            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border capitalize ${ROLE_BADGE[user?.role] || ROLE_BADGE.patient}`}>
              {user?.role || "patient"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-surface-hover rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 flex-1 justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-15" />
            <div className="relative bg-surface rounded-3xl border border-border p-8">
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Personal Information
              </h2>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-3 pr-24 bg-surface-hover/50 border border-border rounded-xl text-muted cursor-not-allowed outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted bg-surface px-2 py-1 rounded-md border border-border">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">Email cannot be changed for security reasons.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone Number <span className="text-muted font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Account Role</label>
                  <div className={`px-4 py-3 rounded-xl border capitalize font-semibold text-sm ${ROLE_BADGE[user?.role] || ROLE_BADGE.patient}`}>
                    {user?.role || "patient"}
                  </div>
                  <p className="text-xs text-muted mt-1">Role is assigned by the system and cannot be changed.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Saving...
                    </span>
                  ) : "Save Changes"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === "security" && (
          <div className="space-y-5">
            {/* Change Password Card */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-15" />
              <div className="relative bg-surface rounded-3xl border border-border p-8">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <PasswordInput label="Current Password" field="current" placeholder="Your current password" />
                  
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        required
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 pr-11 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer">
                        {showPasswords.new
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                    {passwords.newPassword && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-border"}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${passwordStrength === 4 ? "text-emerald-500" : passwordStrength >= 2 ? "text-amber-500" : "text-red-500"}`}>
                          {strengthLabels[passwordStrength - 1] || "Too weak"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        required
                        value={passwords.confirmNewPassword}
                        onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                        placeholder="Repeat your new password"
                        className={`w-full px-4 py-3 pr-11 bg-surface-hover border rounded-xl text-foreground placeholder:text-muted/60 focus:ring-2 transition-all outline-none ${
                          passwords.confirmNewPassword && passwords.newPassword !== passwords.confirmNewPassword
                            ? "border-red-500 focus:ring-red-500/20"
                            : passwords.confirmNewPassword && passwords.newPassword === passwords.confirmNewPassword
                            ? "border-emerald-500 focus:ring-emerald-500/20"
                            : "border-border focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer">
                        {showPasswords.confirm
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                    {passwords.confirmNewPassword && passwords.newPassword !== passwords.confirmNewPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        Changing...
                      </span>
                    ) : "Change Password"}
                  </button>
                </form>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-surface rounded-2xl border border-red-500/20 p-6">
              <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Forgot your current password?
              </h3>
              <p className="text-sm text-muted mb-4">
                You can reset your password via email. A secure link will be sent to <strong className="text-foreground">{user?.email}</strong>.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Send Password Reset Email
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
