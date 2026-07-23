"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHospital, setFilterHospital] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  const [formData, setFormData] = useState({ name: "", hospitalId: "", doctorSlots: "3" });

  const fetchData = async () => {
    try {
      const [deptRes, hospRes] = await Promise.all([
        apiClient.get("/hospitals/departments"),
        apiClient.get("/hospitals")
      ]);
      setDepartments(deptRes.data.data);
      setHospitals(hospRes.data.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = departments.filter((d) => {
    const matchesSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.hospital?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHospital = filterHospital === "all" || d.hospital?._id === filterHospital;
    return matchesSearch && matchesHospital;
  });

  // Group by hospital
  const grouped = filtered.reduce((acc, dept) => {
    const key = dept.hospital?.name || "Unknown Hospital";
    if (!acc[key]) acc[key] = [];
    acc[key].push(dept);
    return acc;
  }, {});

  const openCreate = () => {
    setFormData({ name: "", hospitalId: hospitals[0]?._id || "", doctorSlots: "3" });
    setEditingDept(null);
    setIsCreateOpen(true);
  };

  const openEdit = (dept) => {
    setFormData({ name: dept.name, hospitalId: dept.hospital?._id || "", doctorSlots: String(dept.doctorSlots || 1) });
    setEditingDept(dept);
    setIsCreateOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingDept) {
        await apiClient.patch(`/admin/departments/${editingDept._id}`, formData);
        toast.success("Department updated");
      } else {
        await apiClient.post("/admin/departments", formData);
        toast.success("Department added");
      }
      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save department");
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await apiClient.delete(`/admin/departments/${deletingDept._id}`);
      toast.success("Department deleted");
      setIsDeleteOpen(false);
      setDeletingDept(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete department");
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Manage Departments</h1>
            <p className="text-muted mt-1">Create, edit, and remove departments across hospitals.</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-accent to-primary shadow-lg shadow-accent/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Department
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search departments..." className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <select
            value={filterHospital}
            onChange={(e) => setFilterHospital(e.target.value)}
            className="px-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
            
            <option value="all">All Hospitals</option>
            {hospitals.map((h) =>
            <option key={h._id} value={h._id}>{h.name}</option>
            )}
          </select>
        </div>

        {/* Grouped Departments */}
        {Object.keys(grouped).length === 0 ?
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-lg font-bold text-foreground mb-2">No departments found</h3>
            <p className="text-muted text-sm">Try adjusting your search or filter.</p>
          </div> :

        Object.entries(grouped).map(([hospitalName, depts]) =>
        <div key={hospitalName}>
              <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {hospitalName}
                <span className="text-xs font-normal">({depts.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                {depts.map((dept) =>
            <div key={dept.id} className="group bg-surface rounded-2xl border border-border p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{dept.name}</h3>
                      <StatusBadge status={dept.crowd} />
                    </div>
                    <div className="space-y-1.5 text-xs text-muted mb-4">
                      <div className="flex justify-between"><span>Doctor Slots</span><span className="font-semibold text-foreground">{dept.activeDoctors}/{dept.doctorSlots}</span></div>
                      <div className="flex justify-between"><span>Queue</span><span className="font-semibold text-foreground">{dept.currentQueue} patients</span></div>
                      <div className="flex justify-between"><span>Wait Time</span><span className="font-semibold text-foreground">{dept.waitTime}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(dept)} className="flex-1 py-2 text-xs font-semibold text-foreground rounded-lg border border-border hover:bg-surface-hover transition-all cursor-pointer">Edit</button>
                      <button onClick={() => {setDeletingDept(dept);setIsDeleteOpen(true);}} className="py-2 px-3 text-xs font-semibold text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
            )}
              </div>
            </div>
        )
        }

        <p className="text-xs text-muted">{filtered.length} of {departments.length} departments</p>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingDept ? "Edit Department" : "Add New Department"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Department Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Cardiology" className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Hospital</label>
            <select value={formData.hospitalId} onChange={(e) => setFormData((p) => ({ ...p, hospitalId: e.target.value }))} className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
              {hospitals.map((h) =>
              <option key={h._id} value={h._id}>{h.name}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Doctor Slots</label>
            <input type="number" min="1" max="20" value={formData.doctorSlots} onChange={(e) => setFormData((p) => ({ ...p, doctorSlots: e.target.value }))} className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-accent to-primary shadow-lg hover:shadow-xl transition-all cursor-pointer">{editingDept ? "Save" : "Create"}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Department" size="sm">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </div>
          <p className="text-sm text-muted mb-6">Delete <strong>{deletingDept?.name}</strong> from {deletingDept?.hospitalName}?</p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-red-500 shadow-lg shadow-red-500/25 hover:bg-red-600 transition-all cursor-pointer">Delete</button>
          </div>
        </div>
      </Modal>
    </DashboardShell>);

}