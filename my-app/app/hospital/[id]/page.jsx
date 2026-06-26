"use client";

import { use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { getHospitalById, MOCK_HOSPITALS } from "@/lib/mock-data";

export default function HospitalDetailPage({
  params


}) {
  const { id } = use(params);
  const hospital = getHospitalById(id);

  if (!hospital) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Hospital Not Found</h1>
            <p className="text-muted mb-6">The hospital you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-primary to-accent">
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </>);

  }

  const crowdPercentage = hospital.crowd === "low" ? 25 : hospital.crowd === "medium" ? 55 : 85;
  const crowdColor = hospital.crowd === "low" ? "#10b981" : hospital.crowd === "medium" ? "#f59e0b" : "#ef4444";

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Hospital info */}
            <div className="flex-1 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={hospital.crowd} size="md" />
                <span className="flex items-center gap-1 text-sm text-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {hospital.rating} rating
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4">{hospital.name}</h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted mb-8">
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {hospital.address}
                </span>
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {hospital.phone}
                </span>
                {hospital.distance &&
                <span className="flex items-center gap-2 text-primary font-medium">
                    📍 {hospital.distance} away
                  </span>
                }
              </div>

              <Link
                href={`/patient/book?hospital=${hospital.id}`}
                id="book-token-cta"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-300">
                
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Book Token Now
              </Link>
            </div>

            {/* Crowd Meter */}
            <div className="bg-surface rounded-3xl border border-border p-8 min-w-[280px] text-center animate-fade-in-up delay-200">
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Current Crowd</h3>
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-border" />
                  <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" strokeLinecap="round" style={{ stroke: crowdColor, strokeDasharray: `${crowdPercentage * 2.64} 264` }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-extrabold text-foreground">{crowdPercentage}%</span>
                </div>
              </div>
              <StatusBadge status={hospital.crowd} size="md" />
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted">Average Wait Time</p>
                <p className="text-2xl font-extrabold text-foreground">{hospital.waitTime}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
            {[
            { label: "Total Beds", value: hospital.totalBeds, icon: "🛏️" },
            { label: "Available Beds", value: hospital.availableBeds, icon: "✅" },
            { label: "Departments", value: hospital.departments.length, icon: "🏢" },
            { label: "Rating", value: `${hospital.rating}★`, icon: "⭐" }].
            map((stat) =>
            <div key={stat.label} className="bg-surface rounded-2xl border border-border p-5 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            )}
          </div>

          {/* Departments */}
          <div>
            <h2 className="text-2xl font-extrabold text-foreground mb-6">
              Departments <span className="text-muted text-lg font-normal">({hospital.departments.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hospital.departments.map((dept) =>
              <div key={dept.id} className="group bg-surface rounded-2xl border border-border p-6 hover:border-primary/20 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{dept.name}</h3>
                    <StatusBadge status={dept.crowd} />
                  </div>
                  <div className="space-y-2 text-sm text-muted">
                    <div className="flex justify-between">
                      <span>Wait Time</span>
                      <span className="font-semibold text-foreground">{dept.waitTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>In Queue</span>
                      <span className="font-semibold text-foreground">{dept.currentQueue} patients</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Doctors</span>
                      <span className="font-semibold text-foreground">{dept.activeDoctors}/{dept.doctorSlots}</span>
                    </div>
                  </div>
                  {/* Progress bar for queue */}
                  <div className="mt-4 w-full bg-border rounded-full h-1.5">
                    <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(dept.currentQueue / 15 * 100, 100)}%`,
                      backgroundColor: crowdColor
                    }} />
                  
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Other hospitals */}
      <section className="py-16 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-foreground mb-6">Other Hospitals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_HOSPITALS.filter((h) => h.id !== hospital.id).map((h) =>
            <Link key={h.id} href={`/hospital/${h.id}`} className="group bg-surface rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{h.name}</h3>
                  <StatusBadge status={h.crowd} />
                </div>
                <p className="text-xs text-muted mb-2">{h.address}</p>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>⏱️ {h.waitTime}</span>
                  <span>⭐ {h.rating}</span>
                  {h.distance && <span className="text-primary font-medium">📍 {h.distance}</span>}
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>);

}