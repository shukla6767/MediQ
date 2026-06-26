"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
  { href: "#about", label: "About" },
  { href: "#search", label: "Search Hospital" },
  { href: "#nearby", label: "Nearby Hospitals" },
  { href: "#crowd", label: "Crowd Level" }];


  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ?
      "glass shadow-lg shadow-black/5 py-3" :
      "bg-transparent py-5"}`
      }>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow duration-300">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <path d="M12 6v8" />
                  <path d="M8 10h8" />
                  <path d="M3 10h1" />
                  <path d="M20 10h1" />
                  <path d="M5 18h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                  <path d="M7 22h10" />
                  <path d="M12 18v4" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">
              MediQueue
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
            <a
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-surface-hover group">
              
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 group-hover:w-2/3" />
              </a>
            )}
          </div>

          {/* Login Button and Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <Link
                href={`/${user.role}/dashboard`}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-foreground bg-surface-hover rounded-full border border-border hover:border-primary/50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                id="login-button"
                className="relative inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-full bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300">
                
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            id="mobile-menu-toggle"
            className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu">
            
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              
              {isMobileMenuOpen ?
              <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </> :

              <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              }
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isMobileMenuOpen ? "max-h-80 mt-4 opacity-100" : "max-h-0 opacity-0"}`
          }>
          
          <div className="glass rounded-2xl p-4 space-y-1">
            {navLinks.map((link) =>
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover rounded-xl transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}>
              
                {link.label}
              </a>
            )}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <ThemeToggle />
              {isAuthenticated && user ? (
                <Link
                  href={`/${user.role}/dashboard`}
                  className="flex-1 ml-4 text-center px-4 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex-1 ml-4 text-center px-4 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent"
                  onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>);

}