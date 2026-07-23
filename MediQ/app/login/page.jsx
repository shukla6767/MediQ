"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password
      }, {
        withCredentials: true // Extremely important to receive the HTTP-only cookie
      });
      
      const user = response.data.data.user;
      login(user);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Redirect based on role
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "doctor") router.push("/doctor/dashboard");
      else if (user.role === "receptionist") router.push("/reception/dashboard");
      else router.push("/patient/dashboard");
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        credential: credentialResponse.credential,
      }, { withCredentials: true });

      const user = response.data.data.user;
      login(user);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(`/${user.role}/dashboard`);
    } catch (error) {
      toast.error("Google login failed");
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-up">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4" /><path d="M16 2v4" /><path d="M12 6v8" /><path d="M8 10h8" />
                  <path d="M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold gradient-text">MediQueue</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-foreground">Welcome back</h1>
            <p className="text-muted mt-2">Sign in to manage your appointments</p>
          </div>

          {/* Card */}
          <div className="relative animate-fade-in-up delay-100">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur-sm opacity-20" />
            <div className="relative bg-surface rounded-3xl border border-border p-8 shadow-2xl shadow-black/5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                    
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="block text-sm font-semibold text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility">
                      
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ?
                        <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </> :

                        <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        }
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-[var(--primary)]" />
                    
                    <span className="text-sm text-muted">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                  
                  {isLoading ?
                  <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Signing in...
                    </span> :

                  "Sign In"
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted font-medium">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Social login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Login failed")}
                  useOneTap
                  shape="rectangular"
                  theme="filled_blue"
                  text="continue_with"
                  size="large"
                />
              </div>

              {/* Register link */}
              <p className="text-center text-sm text-muted mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}