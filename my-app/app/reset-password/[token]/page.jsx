"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

const API = "http://localhost:5000/api";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [strength, setStrength] = useState(0);

  // Password strength indicator
  useEffect(() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    setStrength(score);
  }, [form.password]);

  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password/${token}`, {
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setIsSuccess(true);
      toast.success("Password reset successfully!");
      // Auto-redirect after 2s
      setTimeout(() => router.push("/login"), 2500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed. Link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Invalid Reset Link</h2>
          <p className="text-muted mb-4">This reset link is not valid.</p>
          <Link href="/forgot-password" className="text-primary font-semibold hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">M</div>
            <span className="text-xl font-extrabold text-foreground">MediQueue</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20" />
          <div className="relative bg-surface rounded-3xl border border-border p-8 shadow-2xl">

            {!isSuccess ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>

                <h1 className="text-2xl font-extrabold text-foreground text-center mb-2">Set New Password</h1>
                <p className="text-muted text-sm text-center mb-8">
                  Your new password must be at least 8 characters long.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 pr-11 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showPassword
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>

                    {/* Password strength */}
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < strength ? strengthColors[strength - 1] : "bg-border"}`} />
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${strength === 4 ? "text-emerald-500" : strength >= 2 ? "text-amber-500" : "text-red-500"}`}>
                          {strengthLabels[strength - 1] || "Too weak"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={form.confirmPassword}
                        onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="Repeat your password"
                        className={`w-full px-4 py-3 pr-11 bg-surface-hover border rounded-xl text-foreground placeholder:text-muted/60 focus:ring-2 transition-all outline-none ${
                          form.confirmPassword && form.password !== form.confirmPassword
                            ? "border-red-500 focus:ring-red-500/20"
                            : form.confirmPassword && form.password === form.confirmPassword
                            ? "border-emerald-500 focus:ring-emerald-500/20"
                            : "border-border focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors cursor-pointer"
                      >
                        {showConfirm
                          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !form.password || !form.confirmPassword}
                    className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        Resetting...
                      </span>
                    ) : "Reset Password"}
                  </button>
                </form>

                <p className="text-center text-sm text-muted mt-6">
                  Link expired?{" "}
                  <Link href="/forgot-password" className="text-primary font-semibold hover:underline">
                    Request a new one
                  </Link>
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Password Reset!</h2>
                <p className="text-muted text-sm mb-6">
                  Your password has been updated. Redirecting you to login...
                </p>
                <div className="w-full bg-border rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent animate-[progress_2.5s_linear_forwards]" style={{ width: "100%" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
