"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "" // Require explicit selection
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.role) {
      toast.error("Please select a role (Patient, Doctor, or Receptionist).");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });
      
      toast.success("Account created successfully! Please log in.");
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!formData.role) {
      toast.error("Please select your role before signing up with Google.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        credential: credentialResponse.credential,
        role: formData.role // Pass selected role
      }, { withCredentials: true });

      const user = response.data.data.user;
      login(user);
      toast.success(`Welcome, ${user.name}!`);
      router.push(`/${user.role}/dashboard`);
    } catch (error) {
      toast.error("Google login failed");
    }
  };

  const roles = [
    { value: "patient", label: "Patient", icon: "👤", desc: "Book tokens & manage appointments" },
    { value: "admin", label: "Admin", icon: "👑", desc: "Manage system and hospitals" }
  ];


  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float delay-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
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
            <h1 className="text-3xl font-extrabold text-foreground">Create your account</h1>
            <p className="text-muted mt-2">Join MediQueue and skip the wait</p>
          </div>

          {/* Card */}
          <div className="relative animate-fade-in-up delay-100">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-3xl blur-sm opacity-20" />
            <div className="relative bg-surface rounded-3xl border border-border p-8 shadow-2xl shadow-black/5">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label htmlFor="register-name" className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <input id="register-name" type="text" placeholder="John Doe" value={formData.name} onChange={(e) => updateField("name", e.target.value)} required className="w-full pl-12 pr-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="register-email" className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input id="register-email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => updateField("email", e.target.value)} required className="w-full pl-12 pr-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="register-phone" className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <input id="register-phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} required className="w-full pl-12 pr-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="register-password" className="block text-sm font-semibold text-foreground mb-2">Password</label>
                    <div className="relative">
                      <input id="register-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => updateField("password", e.target.value)} required minLength={8} className="w-full px-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="register-confirm" className="block text-sm font-semibold text-foreground mb-2">Confirm</label>
                    <div className="relative">
                      <input id="register-confirm" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} required className="w-full px-4 py-3.5 bg-surface-hover border border-border rounded-xl text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm" />
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer -mt-2">
                  <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="w-4 h-4 rounded border-border accent-[var(--primary)] cursor-pointer" />
                  <span className="text-xs text-muted">Show passwords</span>
                </label>

                {/* Role selector */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) =>
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => updateField("role", role.value)}
                      className={`relative p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                      formData.role === role.value ?
                      "border-primary bg-primary/5 shadow-lg shadow-primary/10" :
                      "border-border hover:border-primary/30 hover:bg-surface-hover"}`
                      }>
                      
                        <div className="text-2xl mb-1">{role.icon}</div>
                        <div className="text-xs font-bold text-foreground">{role.label}</div>
                        {formData.role === role.value &&
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                      }
                      </button>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} required className="w-4 h-4 rounded border-border accent-[var(--primary)] cursor-pointer mt-0.5" />
                  <span className="text-xs text-muted leading-relaxed">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </span>
                </label>

                {/* Submit */}
                <button
                  id="register-submit"
                  type="submit"
                  disabled={isLoading || !agreeTerms}
                  className="w-full py-3.5 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-accent to-primary shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100">
                  
                  {isLoading ?
                  <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Creating account...
                    </span> :

                  "Create Account"
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
                  text="signup_with"
                  size="large"
                />
              </div>

              {/* Login link */}
              <p className="text-center text-sm text-muted mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);

}