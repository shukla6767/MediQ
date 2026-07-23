"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { MOCK_CROWD_TREND, MOCK_PEAK_HOURS, MOCK_WAIT_TIMES, MOCK_USERS } from "@/lib/mock-data";

const adminUser = MOCK_USERS[3];



export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week");

  const maxCrowd = Math.max(...MOCK_CROWD_TREND.map((d) => d.value));
  const maxPeak = Math.max(...MOCK_PEAK_HOURS.map((d) => d.value));
  const maxWait = Math.max(...MOCK_WAIT_TIMES.map((d) => d.value));

  return (
    <DashboardShell role="admin" userName={adminUser.name}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">
              <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-muted mt-1">Crowd trends, peak hours, and wait time insights.</p>
          </div>
          <div className="flex gap-1 bg-surface-hover rounded-xl p-1">
            {["today", "week", "month"].map((range) =>
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 capitalize ${
              timeRange === range ?
              "bg-surface text-foreground shadow-sm" :
              "text-muted hover:text-foreground"}`
              }>
              
                {range}
              </button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
          { label: "Peak Hour", value: "10-11 AM", icon: "⏰", color: "text-amber-500" },
          { label: "Busiest Day", value: "Wednesday", icon: "📅", color: "text-blue-500" },
          { label: "Avg Crowd", value: "62%", icon: "👥", color: "text-violet-500" },
          { label: "Avg Wait", value: "18 min", icon: "⏱️", color: "text-emerald-500" }].
          map((stat) =>
          <div key={stat.label} className="bg-surface rounded-2xl border border-border p-5 text-center hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </div>
          )}
        </div>

        {/* Crowd Trend Chart */}
        <div className="bg-surface rounded-3xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Crowd Trend</h2>
              <p className="text-xs text-muted mt-0.5">Hourly crowd percentage throughout the day</p>
            </div>
            <span className="text-xs text-muted bg-surface-hover px-3 py-1.5 rounded-lg">Avg: 62%</span>
          </div>

          {/* Line chart approximation using bars */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] text-muted">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            <div className="ml-10">
              {/* Grid lines */}
              <div className="relative h-52 border-b border-border">
                {[0, 25, 50, 75].map((line) =>
                <div key={line} className="absolute w-full border-t border-border/50" style={{ bottom: `${line}%` }} />
                )}

                {/* Bars */}
                <div className="absolute inset-0 flex items-end gap-1 px-1">
                  {MOCK_CROWD_TREND.map((point, i) => {
                    const height = point.value / maxCrowd * 100;
                    const color = point.value > 80 ? "from-red-400 to-red-500" : point.value > 50 ? "from-amber-400 to-amber-500" : "from-emerald-400 to-emerald-500";
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div
                          className={`w-full rounded-t-md bg-gradient-to-t ${color} transition-all duration-500 hover:opacity-80 cursor-pointer min-h-[4px]`}
                          style={{ height: `${height}%` }} />
                        
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10">
                          {point.value}%
                        </div>
                      </div>);

                  })}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex gap-1 px-1 mt-2">
                {MOCK_CROWD_TREND.map((point, i) =>
                <div key={i} className="flex-1 text-center text-[9px] text-muted truncate">{point.label}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Hours */}
          <div className="bg-surface rounded-3xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Peak Hours by Day</h2>
            <p className="text-xs text-muted mb-6">Average crowd levels per day of the week</p>
            <div className="space-y-3">
              {MOCK_PEAK_HOURS.map((day) => {
                const width = day.value / maxPeak * 100;
                const color = day.value > 80 ? "from-red-400 to-red-500" : day.value > 60 ? "from-amber-400 to-amber-500" : "from-emerald-400 to-emerald-500";
                return (
                  <div key={day.label} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted w-10">{day.label}</span>
                    <div className="flex-1 h-8 bg-surface-hover rounded-lg overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${color} rounded-lg flex items-center justify-end pr-3 transition-all duration-700`}
                        style={{ width: `${width}%` }}>
                        
                        <span className="text-[10px] font-bold text-white">{day.value}%</span>
                      </div>
                    </div>
                  </div>);

              })}
            </div>
          </div>

          {/* Wait Time Distribution */}
          <div className="bg-surface rounded-3xl border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Wait Time Distribution</h2>
            <p className="text-xs text-muted mb-6">Number of patients per wait time bracket</p>
            <div className="flex items-end gap-4 h-48 px-2">
              {MOCK_WAIT_TIMES.map((bucket, i) => {
                const height = bucket.value / maxWait * 100;
                const colors = ["from-cyan-400 to-cyan-500", "from-blue-400 to-blue-500", "from-violet-400 to-violet-500", "from-amber-400 to-amber-500", "from-orange-400 to-orange-500", "from-red-400 to-red-500"];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">{bucket.value}</span>
                    <div
                      className={`w-full rounded-t-lg bg-gradient-to-t ${colors[i]} transition-all duration-500 hover:opacity-80 cursor-pointer`}
                      style={{ height: `${height}%` }} />
                    
                    <span className="text-[9px] text-muted text-center leading-tight">{bucket.label}</span>
                  </div>);

              })}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">💡 Key Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
            { title: "Reduce Wait Times", desc: "Adding 1 more doctor during 10-11 AM could reduce average wait by 40%.", icon: "⏱️" },
            { title: "Off-Peak Opportunity", desc: "Encourage appointments during 1-3 PM when crowd levels drop below 30%.", icon: "📉" },
            { title: "Weekend Staffing", desc: "Consider reducing Sunday staffing by 25% — traffic is consistently low.", icon: "📋" }].
            map((insight) =>
            <div key={insight.title} className="bg-surface rounded-2xl p-5 border border-border">
                <div className="text-2xl mb-2">{insight.icon}</div>
                <h3 className="text-sm font-bold text-foreground mb-1">{insight.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{insight.desc}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>);

}