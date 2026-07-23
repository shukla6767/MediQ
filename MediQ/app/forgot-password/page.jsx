"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

const API = "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your email");

    setIsLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
              M
            </div>
            <span className="text-xl font-extrabold text-foreground">MediQueue</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20" />
          <div className="relative bg-surface rounded-3xl border border-border p-8 shadow-2xl">

            {!isSubmitted ? (
              <>
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h1 className="text-2xl font-extrabold text-foreground text-center mb-2">Forgot Password?</h1>
                <p className="text-muted text-sm text-center mb-8">
                  Enter your email and we&apos;ll send you a secure reset link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        Sending...
                      </span>
                    ) : "Send Reset Link"}
                  </button>
                </form>

                <p className="text-center text-sm text-muted mt-6">
                  Remembered it?{" "}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Back to Login
                  </Link>
                </p>
              </>
            ) : (
              /* Success state */
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mb-2">Check your email</h2>
                <p className="text-muted text-sm mb-2">
                  We&apos;ve sent a reset link to
                </p>
                <p className="font-bold text-foreground mb-6">{email}</p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left mb-6">
                  <p className="text-amber-500 text-xs font-semibold mb-1">⏱ Link expires in 15 minutes</p>
                  <p className="text-muted text-xs">
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>

                <button
                  onClick={() => { setIsSubmitted(false); setEmail(""); }}
                  className="w-full py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer"
                >
                  Try different email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
