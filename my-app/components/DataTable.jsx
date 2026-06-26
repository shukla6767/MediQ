"use client";

import { useState, useMemo } from "react";

















export default function DataTable({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = "Search...",
  actions,
  emptyMessage = "No data found"
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return typeof val === "string" && val.toLowerCase().includes(q);
      })
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return result;
  }, [data, search, searchKeys, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div>
      {/* Search bar */}
      {searchKeys.length > 0 &&
      <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
          
          </div>
        </div>
      }

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                {columns.map((col) =>
                <th
                  key={col.key}
                  className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted ${col.sortable ? "cursor-pointer hover:text-foreground transition-colors select-none" : ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}>
                  
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && sortKey === col.key &&
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${sortAsc ? "" : "rotate-180"}`}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                    }
                    </div>
                  </th>
                )}
                {actions &&
                <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted">
                    Actions
                  </th>
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ?
              <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12">
                    <p className="text-muted text-sm">{emptyMessage}</p>
                  </td>
                </tr> :

              filteredData.map((item, i) =>
              <tr key={i} className="hover:bg-surface-hover/50 transition-colors">
                    {columns.map((col) =>
                <td key={col.key} className="px-6 py-4 text-sm text-foreground">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                )}
                    {actions &&
                <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {actions(item)}
                        </div>
                      </td>
                }
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Row count */}
      <p className="text-xs text-muted mt-3 px-1">
        Showing {filteredData.length} of {data.length} results
      </p>
    </div>);

}