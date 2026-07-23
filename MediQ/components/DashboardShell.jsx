"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";













const NAV_CONFIG = {
  patient: {
    title: "Patient",
    items: [
    {
      href: "/patient/dashboard",
      label: "Dashboard",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>

    },
    {
      href: "/patient/tokens",
      label: "My Tokens",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>

    },
    {
      href: "/patient/book",
      label: "Book Token",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>

    },
    {
      href: "/profile",
      label: "Profile Settings",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>

    }]

  },
  doctor: {
    title: "Doctor",
    items: [
    {
      href: "/doctor/dashboard",
      label: "Dashboard",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>

    },
    {
      href: "/profile",
      label: "Profile Settings",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>

    }]

  },
  receptionist: {
    title: "Reception",
    items: [
    {
      href: "/reception/dashboard",
      label: "Dashboard",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>

    },
    {
      href: "/reception/queue",
      label: "Queue Management",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>

    },
    {
      href: "/profile",
      label: "Profile Settings",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>

    }]

  },
  admin: {
    title: "Admin",
    items: [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>

    },
    {
      href: "/admin/hospitals",
      label: "Hospitals",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>

    },
    {
      href: "/admin/departments",
      label: "Departments",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>

    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>

    },
    {
      href: "/admin/staff",
      label: "Staff",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>

    },
    {
      href: "/profile",
      label: "Profile Settings",
      icon:
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>

    }]

  }
};

const ROLE_COLORS = {
  patient: "from-cyan-500 to-blue-500",
  doctor: "from-emerald-500 to-teal-500",
  receptionist: "from-amber-500 to-orange-500",
  admin: "from-violet-500 to-purple-500"
};

export default function DashboardShell({ children, role: fallbackRole }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // Route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = user?.role || fallbackRole || "patient";
  const userName = user?.name || "User";
  const navConfig = NAV_CONFIG[role] || NAV_CONFIG["patient"];
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS["patient"];

  // Prevent flash of dummy data while redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-surface border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
        }>
        
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-border">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v4" /><path d="M16 2v4" /><path d="M12 6v8" /><path d="M8 10h8" />
                  <path d="M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">MediQueue</span>
            </Link>
          </div>

          {/* Role badge */}
          <div className="px-6 py-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleColor} text-white text-xs font-bold uppercase tracking-wider`}>
              <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
              {navConfig.title} Panel
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 px-4 space-y-1">
            {navConfig.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive ?
                  "bg-primary/10 text-primary shadow-sm" :
                  "text-muted hover:text-foreground hover:bg-surface-hover"}`
                  }>
                  
                  <span className={`transition-colors ${isActive ? "text-primary" : "text-muted group-hover:text-foreground"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive &&
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  }
                </Link>);

            })}
          </nav>

          {/* Bottom user section */}
          <div className="px-4 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-hover">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-bold`}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted capitalize">{role}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors" title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Open sidebar">
              
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications bell */}
              <button className="relative p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-surface" />
              </button>

              {/* User avatar with dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer`}>
                  {userName.charAt(0).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-surface border border-border rounded-xl shadow-xl py-2 z-50 animate-fade-in-up">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-bold text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted capitalize">{role}</p>
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Profile Settings
                      </button>
                    </div>
                    <div className="py-1 border-t border-border">
                      <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2 font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>);

}