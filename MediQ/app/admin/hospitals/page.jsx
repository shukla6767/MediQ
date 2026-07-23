"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [deletingHospital, setDeletingHospital] = useState(null);

  const [formData, setFormData] = useState({ 
    name: "", 
    address: "", 
    formattedAddress: "",
    googlePlaceId: "",
    location: { type: "Point", coordinates: [] },
    phone: "", 
    email: "", 
    totalBeds: "" 
  });

  const fetchHospitals = async () => {
    try {
      const { data } = await apiClient.get("/hospitals");
      setHospitals(data.data);
    } catch (error) {
      toast.error("Failed to load hospitals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = searchQuery ?
  hospitals.filter((h) => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.address.toLowerCase().includes(searchQuery.toLowerCase())) :
  hospitals;

  const openCreate = () => {
    setFormData({ 
      name: "", 
      address: "", 
      formattedAddress: "",
      googlePlaceId: "",
      location: { type: "Point", coordinates: [] },
      phone: "", 
      email: "", 
      totalBeds: "" 
    });
    setEditingHospital(null);
    setIsCreateOpen(true);
  };

  const openEdit = (hospital) => {
    setFormData({ 
      name: hospital.name || "", 
      address: hospital.address || "", 
      formattedAddress: hospital.formattedAddress || "",
      googlePlaceId: hospital.googlePlaceId || "",
      location: hospital.location || { type: "Point", coordinates: [] },
      phone: hospital.phone || "", 
      email: hospital.email || "", 
      totalBeds: hospital.totalBeds || "" 
    });
    setEditingHospital(hospital);
    setIsCreateOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingHospital) {
        await apiClient.patch(`/admin/hospitals/${editingHospital._id}`, formData);
        toast.success("Hospital updated");
      } else {
        await apiClient.post("/admin/hospitals", formData);
        toast.success("Hospital added");
      }
      setIsCreateOpen(false);
      fetchHospitals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save hospital");
    }
  };

  const handleDelete = async () => {
    if (!deletingHospital) return;
    try {
      await apiClient.delete(`/admin/hospitals/${deletingHospital._id}`);
      toast.success("Hospital deleted");
      setIsDeleteOpen(false);
      setDeletingHospital(null);
      fetchHospitals();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete hospital");
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Manage Hospitals</h1>
            <p className="text-muted mt-1">Create, update, and delete hospital records.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
            
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Hospital
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals..."
            className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
          
        </div>

        {/* Hospital Cards */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin text-primary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.map((hospital) =>
            <div key={hospital._id} className="group bg-surface rounded-2xl border border-border p-6 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{hospital.name}</h3>
                    <p className="text-sm text-muted mt-0.5">{hospital.address}</p>
                  </div>
                  <StatusBadge status={hospital.crowd || "low"} />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-surface-hover rounded-xl py-2">
                    <p className="text-lg font-bold text-foreground">{hospital.departments?.length || 0}</p>
                    <p className="text-[10px] text-muted">Departments</p>
                  </div>
                  <div className="bg-surface-hover rounded-xl py-2">
                    <p className="text-lg font-bold text-foreground">{hospital.totalBeds}</p>
                    <p className="text-[10px] text-muted">Beds</p>
                  </div>
                  <div className="bg-surface-hover rounded-xl py-2">
                    <p className="text-lg font-bold text-foreground">{hospital.rating}⭐</p>
                    <p className="text-[10px] text-muted">Rating</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted mb-4">
                  <span>📞 {hospital.phone}</span>
                  <span>· ✉️ {hospital.email}</span>
                </div>

                <div className="flex gap-2">
                  <button
                  onClick={() => openEdit(hospital)}
                  className="flex-1 py-2.5 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover hover:border-primary/30 transition-all cursor-pointer">
                  
                    Edit
                  </button>
                  <button
                  onClick={() => {setDeletingHospital(hospital);setIsDeleteOpen(true);}}
                  className="py-2.5 px-4 text-sm font-semibold text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer">
                  
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted">{filteredHospitals.length} of {hospitals.length} hospitals</p>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={editingHospital ? "Edit Hospital" : "Add New Hospital"}>
        <div className="space-y-4">
          {[
          { key: "name", label: "Hospital Name", placeholder: "City General Hospital" },
          { key: "address", label: "Address", placeholder: "123 Main Street, Downtown" },
          { key: "phone", label: "Phone", placeholder: "+1 (555) 000-0000" },
          { key: "email", label: "Email", placeholder: "info@hospital.com" },
          { key: "totalBeds", label: "Total Beds", placeholder: "100" }].
          map((field) =>
          <div key={field.key}>
              <label className="block text-sm font-semibold text-foreground mb-1.5">{field.label}</label>
              <input
              type="text"
              value={formData[field.key]}
              onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg hover:shadow-xl transition-all cursor-pointer">
              {editingHospital ? "Save Changes" : "Create Hospital"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Hospital" size="sm">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Are you sure?</h3>
          <p className="text-sm text-muted mb-6">
            This will permanently delete <strong>{deletingHospital?.name}</strong> and all its departments.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-3 text-sm font-semibold text-foreground rounded-xl border border-border hover:bg-surface-hover transition-all cursor-pointer">
              Cancel
            </button>
            <button onClick={handleDelete} className="flex-1 py-3 text-sm font-bold text-white rounded-xl bg-red-500 shadow-lg shadow-red-500/25 hover:bg-red-600 transition-all cursor-pointer">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </DashboardShell>);

}