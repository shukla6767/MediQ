"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import apiClient from "@/lib/apiClient";
const STATS = [
{ label: "Hospitals Listed", value: "500+", icon: "🏥" },
{ label: "Daily Visitors", value: "10K+", icon: "👥" },
{ label: "Avg. Wait Saved", value: "35 min", icon: "⏱️" },
{ label: "Patient Rating", value: "4.8★", icon: "⭐" }];


/* ────────────────────────────────
   Helper: Crowd badge
   ──────────────────────────────── */
function CrowdBadge({ level }) {
  const config = {
    low: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      dot: "bg-emerald-500",
      label: "Low"
    },
    medium: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      dot: "bg-amber-500",
      label: "Moderate"
    },
    high: {
      bg: "bg-red-500/10",
      text: "text-red-500",
      dot: "bg-red-500",
      label: "Busy"
    }
  };

  const c = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>);

}

/* ────────────────────────────────
   Helper: Hospital card
   ──────────────────────────────── */
function HospitalCard({
  hospital,
  index



}) {
  return (
    <div
      className="group relative bg-surface rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: `${index * 0.1}s` }}>
      
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {hospital.name}
          </h3>
          <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {hospital.address}
          </p>
        </div>
        <CrowdBadge level={hospital.crowd} />
      </div>

      {/* Info Row */}
      <div className="flex items-center gap-4 mb-4 text-sm text-muted">
        <span className="flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {hospital.waitTime}
        </span>
        <span className="flex items-center gap-1">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {hospital.rating}
        </span>
        <span className="flex items-center gap-1 text-primary font-medium">
          📍 {hospital.distance}
        </span>
      </div>

      {/* Departments */}
      <div className="flex flex-wrap gap-2">
        {hospital.departmentNames && hospital.departmentNames.map((dept) =>
        <span
          key={dept}
          className="px-3 py-1 text-xs font-medium rounded-lg bg-surface-hover text-muted">
          
            {dept}
          </span>
        )}
      </div>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>);

}

/* ═══════════════════════════════════
   Main Page Component
   ═══════════════════════════════════ */
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allHospitals, setAllHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [visibleSections, setVisibleSections] = useState(
    new Set()
  );
  const sectionRefs = useRef({});

  // Fetch all hospitals on mount
  useEffect(() => {
    apiClient.get("/hospitals").then(({ data }) => {
      // Map API data to format needed by UI
      const mapped = (data.data || []).map(h => ({
        ...h,
        id: h._id,
        distance: h.distance || "1.5 km", // Fallback if no distance logic yet
        crowd: h.crowd || "low",
        waitTime: h.waitTime || "~15 min",
        rating: h.rating || 4.5,
      }));
      setAllHospitals(mapped);
      setFilteredHospitals(mapped);
    }).catch(console.error);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHospitals(allHospitals);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredHospitals(
      allHospitals.filter(
        (h) =>
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        (h.departmentNames && h.departmentNames.some((d) => d.toLowerCase().includes(q)))
      )
    );
  }, [searchQuery, allHospitals]);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const sections = document.querySelectorAll("[data-animate]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const isVisible = (id) => visibleSections.has(id);

  return (
    <>
      <Navbar />

      {/* ═══════════════════════════════════
           HERO SECTION
          ═══════════════════════════════════ */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center overflow-hidden">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hospital-hero.png"
            alt="Modern hospital building"
            fill
            className="object-cover"
            preload />
          
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-transparent" />
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float delay-300" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Hospital Tracking
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight animate-fade-in-up delay-100">
              Skip the Wait,{" "}
              <span className="gradient-text animate-gradient">
                Get Care Faster
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted max-w-2xl leading-relaxed animate-fade-in-up delay-200">
              Find hospitals near you, check real-time crowd levels, and join
              queues from your phone. No more waiting rooms — arrive right on
              time.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-in-up delay-300">
              <a
                href="#search"
                id="hero-search-cta"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300">
                
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Find a Hospital
              </a>
              <a
                href="#about"
                id="hero-learn-cta"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-foreground rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-surface transition-all duration-300">
                
                Learn More
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 animate-fade-in-up delay-500">
              {STATS.map((stat) =>
              <div
                key={stat.label}
                className="glass rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300">
                
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted mt-0.5">
                    {stat.label}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted">
            
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════
           ABOUT SECTION
          ═══════════════════════════════════ */}
      <section
        id="about"
        data-animate
        className="py-24 sm:py-32 relative">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`transition-all duration-700 ${
            isVisible("about") ?
            "opacity-100 translate-y-0" :
            "opacity-0 translate-y-8"}`
            }>
            
            {/* Section Label */}
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 rounded-full mb-4">
                About Us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                Healthcare Access,{" "}
                <span className="gradient-text">Reimagined</span>
              </h2>
              <p className="mt-5 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                MediQueue connects patients to hospitals in real time. We
                eliminate guesswork from your healthcare journey with live data,
                smart routing, and instant queue management.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
              {
                icon:
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>,

                title: "Smart Search",
                description:
                "Search by hospital name, specialty, or location. Our intelligent engine finds the best match instantly.",
                gradient: "from-cyan-500 to-blue-500"
              },
              {
                icon:
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>,

                title: "Nearby Discovery",
                description:
                "Instantly find hospitals around you with GPS-powered proximity detection and directions.",
                gradient: "from-violet-500 to-purple-500"
              },
              {
                icon:
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>,

                title: "Live Crowd Data",
                description:
                "See real-time crowd levels and estimated wait times before you even leave home.",
                gradient: "from-pink-500 to-rose-500"
              }].
              map((feature, i) =>
              <div
                key={feature.title}
                className="group relative bg-surface rounded-3xl border border-border p-8 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${i * 0.15}s` }}>
                
                  <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
           SEARCH HOSPITAL SECTION
          ═══════════════════════════════════ */}
      <section
        id="search"
        data-animate
        className="py-24 sm:py-32 relative bg-surface/50">
        
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`transition-all duration-700 ${
            isVisible("search") ?
            "opacity-100 translate-y-0" :
            "opacity-0 translate-y-8"}`
            }>
            
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-accent bg-accent/10 rounded-full mb-4">
                Search
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                Find Your{" "}
                <span className="gradient-text">Hospital</span>
              </h2>
              <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
                Search by name, department, or location to find the right
                hospital for your needs.
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative flex items-center bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">
                  <svg
                    className="ml-5 text-muted"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    id="hospital-search-input"
                    type="text"
                    placeholder="Search hospitals, departments, specialties..."
                    className="flex-1 px-4 py-5 bg-transparent text-foreground placeholder:text-muted/60 text-base outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} />
                  
                  {searchQuery &&
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mr-3 p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                    aria-label="Clear search">
                    
                      <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  }
                  <button
                    id="hospital-search-button"
                    className="m-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                    
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHospitals.length > 0 ?
              filteredHospitals.map((hospital, i) =>
              <HospitalCard key={hospital.id} hospital={hospital} index={i} />
              ) :

              <div className="col-span-2 text-center py-16">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    No hospitals found
                  </h3>
                  <p className="text-muted">
                    Try adjusting your search terms or browse all hospitals.
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
           NEARBY HOSPITALS SECTION
          ═══════════════════════════════════ */}
      <section
        id="nearby"
        data-animate
        className="py-24 sm:py-32 relative">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`transition-all duration-700 ${
            isVisible("nearby") ?
            "opacity-100 translate-y-0" :
            "opacity-0 translate-y-8"}`
            }>
            
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-emerald-500 bg-emerald-500/10 rounded-full mb-4">
                Nearby
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                Hospitals{" "}
                <span className="gradient-text">Near You</span>
              </h2>
              <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
                Enable location access to discover hospitals closest to you,
                sorted by distance and wait time.
              </p>
            </div>

            {/* Map Placeholder + Hospital list */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Map area */}
              <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-border bg-surface min-h-[400px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="relative text-center p-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-primary">
                      
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Enable Location Services
                  </h3>
                  <p className="text-muted mb-6 max-w-sm mx-auto">
                    Allow location access to see hospitals on an interactive
                    map with live crowd indicators.
                  </p>
                  <button
                    id="enable-location-button"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-primary-dark shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    Share Location
                  </button>
                </div>
              </div>

              {/* Nearby hospital list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                  Closest to you
                </h3>
                {allHospitals.slice().sort(
                  (a, b) =>
                  parseFloat(a.distance) - parseFloat(b.distance)
                ).slice(0, 4).map((hospital, i) =>
                <div
                  key={hospital.id}
                  className="group bg-surface rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                        {hospital.name}
                      </h4>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        {hospital.distance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">
                        Wait: {hospital.waitTime}
                      </span>
                      <CrowdBadge level={hospital.crowd} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
           CURRENT CROWD LEVEL SECTION
          ═══════════════════════════════════ */}
      <section
        id="crowd"
        data-animate
        className="py-24 sm:py-32 relative bg-surface/50">
        
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`transition-all duration-700 ${
            isVisible("crowd") ?
            "opacity-100 translate-y-0" :
            "opacity-0 translate-y-8"}`
            }>
            
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-pink-500 bg-pink-500/10 rounded-full mb-4">
                Live Data
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground">
                Real-Time{" "}
                <span className="gradient-text">Crowd Levels</span>
              </h2>
              <p className="mt-4 text-lg text-muted max-w-xl mx-auto">
                Monitor live crowd data across hospitals. Plan your visit when
                it&apos;s least crowded.
              </p>
            </div>

            {/* Crowd Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allHospitals.slice(0, 4).map((hospital, i) => {
                const crowdPercentage =
                hospital.crowd === "low" ?
                25 :
                hospital.crowd === "medium" ?
                55 :
                85;
                const crowdColor =
                hospital.crowd === "low" ?
                "from-emerald-400 to-emerald-600" :
                hospital.crowd === "medium" ?
                "from-amber-400 to-amber-600" :
                "from-red-400 to-red-600";

                return (
                  <div
                    key={hospital.id}
                    className="group bg-surface rounded-3xl border border-border p-6 hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                    
                    {/* Hospital name */}
                    <h4 className="font-bold text-foreground text-sm mb-1 truncate">
                      {hospital.name}
                    </h4>
                    <p className="text-xs text-muted mb-5">{hospital.waitTime} wait</p>

                    {/* Circular Progress */}
                    <div className="relative w-28 h-28 mx-auto mb-5">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-border" />
                        
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ease-out`}
                          style={{
                            stroke:
                            hospital.crowd === "low" ?
                            "#10b981" :
                            hospital.crowd === "medium" ?
                            "#f59e0b" :
                            "#ef4444",
                            strokeDasharray: `${crowdPercentage * 2.64} 264`,
                            strokeDashoffset: isVisible("crowd") ? 0 : 264
                          }} />
                        
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-extrabold text-foreground">
                          {crowdPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Crowd status */}
                    <div className="text-center">
                      <CrowdBadge level={hospital.crowd} />
                    </div>
                  </div>);

              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-8 mt-10">
              {[
              { color: "bg-emerald-500", label: "Low (< 30%)" },
              { color: "bg-amber-500", label: "Moderate (30–70%)" },
              { color: "bg-red-500", label: "Busy (> 70%)" }].
              map((item) =>
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  {item.label}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
           CTA SECTION
          ═══════════════════════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-gradient" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6">
            Ready to Skip the{" "}
            <span className="gradient-text">Queue?</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            Join thousands of patients who save time every day with MediQueue.
            Sign up for free and take control of your hospital visits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              id="cta-signup-button"
              className="inline-flex items-center gap-2 px-10 py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-300">
              
              Get Started — It&apos;s Free
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a
              href="#about"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-muted hover:text-foreground transition-colors">
              
              Learn more about MediQueue
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>);

}