/* ═══════════════════════════════════════════════════════════════
   MediQueue — Mock Data Layer
   ═══════════════════════════════════════════════════════════════
   All TypeScript interfaces and mock data live here.
   When adding a real database, replace exports in this file
   (or swap to API calls) — zero UI code changes needed.
   ═══════════════════════════════════════════════════════════════ */

// ─── Interfaces ──────────────────────────────────────────────







































































// ─── Mock Data ───────────────────────────────────────────────

export const MOCK_DEPARTMENTS = [
{ id: "d1", name: "Emergency", hospitalId: "h1", hospitalName: "City General Hospital", doctorSlots: 5, activeDoctors: 4, crowd: "high", waitTime: "~35 min", currentQueue: 12 },
{ id: "d2", name: "Cardiology", hospitalId: "h1", hospitalName: "City General Hospital", doctorSlots: 3, activeDoctors: 3, crowd: "low", waitTime: "~10 min", currentQueue: 3 },
{ id: "d3", name: "Orthopedics", hospitalId: "h1", hospitalName: "City General Hospital", doctorSlots: 4, activeDoctors: 2, crowd: "medium", waitTime: "~20 min", currentQueue: 7 },
{ id: "d4", name: "Pediatrics", hospitalId: "h2", hospitalName: "St. Mary's Medical Center", doctorSlots: 4, activeDoctors: 3, crowd: "medium", waitTime: "~25 min", currentQueue: 8 },
{ id: "d5", name: "Neurology", hospitalId: "h2", hospitalName: "St. Mary's Medical Center", doctorSlots: 2, activeDoctors: 2, crowd: "low", waitTime: "~15 min", currentQueue: 4 },
{ id: "d6", name: "Oncology", hospitalId: "h2", hospitalName: "St. Mary's Medical Center", doctorSlots: 3, activeDoctors: 2, crowd: "medium", waitTime: "~30 min", currentQueue: 6 },
{ id: "d7", name: "General Medicine", hospitalId: "h3", hospitalName: "Metro Health Institute", doctorSlots: 6, activeDoctors: 4, crowd: "high", waitTime: "~45 min", currentQueue: 15 },
{ id: "d8", name: "Surgery", hospitalId: "h3", hospitalName: "Metro Health Institute", doctorSlots: 3, activeDoctors: 2, crowd: "medium", waitTime: "~40 min", currentQueue: 5 },
{ id: "d9", name: "Dermatology", hospitalId: "h3", hospitalName: "Metro Health Institute", doctorSlots: 2, activeDoctors: 1, crowd: "high", waitTime: "~50 min", currentQueue: 9 },
{ id: "d10", name: "Family Medicine", hospitalId: "h4", hospitalName: "Sunrise Community Clinic", doctorSlots: 3, activeDoctors: 3, crowd: "low", waitTime: "~5 min", currentQueue: 2 },
{ id: "d11", name: "ENT", hospitalId: "h4", hospitalName: "Sunrise Community Clinic", doctorSlots: 2, activeDoctors: 2, crowd: "low", waitTime: "~8 min", currentQueue: 1 },
{ id: "d12", name: "Ophthalmology", hospitalId: "h4", hospitalName: "Sunrise Community Clinic", doctorSlots: 2, activeDoctors: 1, crowd: "medium", waitTime: "~15 min", currentQueue: 4 }];


export const MOCK_HOSPITALS = [
{
  id: "h1",
  name: "City General Hospital",
  address: "123 Main Street, Downtown",
  phone: "+1 (555) 100-2000",
  email: "info@citygeneral.com",
  rating: 4.8,
  crowd: "low",
  waitTime: "~10 min",
  distance: "0.8 km",
  departments: MOCK_DEPARTMENTS.filter((d) => d.hospitalId === "h1"),
  totalBeds: 500,
  availableBeds: 120,
  createdAt: "2024-01-15",
  formattedAddress: "123 Main Street, Downtown",
  googlePlaceId: "ChIJ_mock_1",
  location: { type: "Point", coordinates: [77.2090, 28.6139] }
},
{
  id: "h2",
  name: "St. Mary's Medical Center",
  address: "456 Oak Avenue, Midtown",
  phone: "+1 (555) 200-3000",
  email: "contact@stmarys.com",
  rating: 4.6,
  crowd: "medium",
  waitTime: "~25 min",
  distance: "1.2 km",
  departments: MOCK_DEPARTMENTS.filter((d) => d.hospitalId === "h2"),
  totalBeds: 350,
  availableBeds: 45,
  createdAt: "2023-06-20",
  formattedAddress: "456 Oak Avenue, Midtown",
  googlePlaceId: "ChIJ_mock_2",
  location: { type: "Point", coordinates: [77.2190, 28.6239] }
},
{
  id: "h3",
  name: "Metro Health Institute",
  address: "789 Park Boulevard, Uptown",
  phone: "+1 (555) 300-4000",
  email: "hello@metrohealth.com",
  rating: 4.4,
  crowd: "high",
  waitTime: "~45 min",
  distance: "2.5 km",
  departments: MOCK_DEPARTMENTS.filter((d) => d.hospitalId === "h3"),
  totalBeds: 800,
  availableBeds: 30,
  createdAt: "2022-03-10",
  formattedAddress: "789 Park Boulevard, Uptown",
  googlePlaceId: "ChIJ_mock_3",
  location: { type: "Point", coordinates: [77.2290, 28.6339] }
},
{
  id: "h4",
  name: "Sunrise Community Clinic",
  address: "321 Elm Drive, Eastside",
  phone: "+1 (555) 400-5000",
  email: "support@sunriseclinic.com",
  rating: 4.9,
  crowd: "low",
  waitTime: "~5 min",
  distance: "3.1 km",
  departments: MOCK_DEPARTMENTS.filter((d) => d.hospitalId === "h4"),
  totalBeds: 150,
  availableBeds: 10,
  createdAt: "2024-02-01",
  formattedAddress: "321 Elm Drive, Eastside",
  googlePlaceId: "ChIJ_mock_4",
  location: { type: "Point", coordinates: [77.2390, 28.6439] }
}];


export const MOCK_USERS = [
{ id: "u1", name: "Rishabh Sharma", email: "rishabh@example.com", phone: "+91 98765 43210", role: "patient", createdAt: "2024-05-01" },
{ id: "u2", name: "Dr. Priya Gupta", email: "priya@hospital.com", phone: "+91 98765 43211", role: "doctor", createdAt: "2023-12-01" },
{ id: "u3", name: "Anita Verma", email: "anita@hospital.com", phone: "+91 98765 43212", role: "receptionist", createdAt: "2024-01-15" },
{ id: "u4", name: "Admin User", email: "admin@mediqueue.com", phone: "+91 98765 43213", role: "admin", createdAt: "2023-01-01" }];


export const MOCK_TOKENS = [
{ id: "t1", tokenNumber: "A-001", patientId: "u1", patientName: "Rishabh Sharma", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d2", departmentName: "Cardiology", status: "waiting", position: 2, estimatedWait: "~15 min", createdAt: "2026-06-10T08:30:00", isEmergency: false },
{ id: "t2", tokenNumber: "A-002", patientId: "u1", patientName: "Rishabh Sharma", hospitalId: "h2", hospitalName: "St. Mary's Medical Center", departmentId: "d4", departmentName: "Pediatrics", status: "completed", position: 0, estimatedWait: "Done", createdAt: "2026-06-09T10:00:00", completedAt: "2026-06-09T10:45:00", isEmergency: false },
{ id: "t3", tokenNumber: "B-005", patientId: "u1", patientName: "Rishabh Sharma", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d1", departmentName: "Emergency", status: "cancelled", position: 0, estimatedWait: "—", createdAt: "2026-06-08T14:00:00", isEmergency: false },
{ id: "t4", tokenNumber: "A-003", patientId: "p2", patientName: "Amit Kumar", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d2", departmentName: "Cardiology", status: "in-progress", position: 0, estimatedWait: "Now", createdAt: "2026-06-10T08:15:00", calledAt: "2026-06-10T09:00:00", isEmergency: false },
{ id: "t5", tokenNumber: "A-004", patientId: "p3", patientName: "Sneha Patel", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d2", departmentName: "Cardiology", status: "waiting", position: 1, estimatedWait: "~8 min", createdAt: "2026-06-10T08:20:00", isEmergency: false },
{ id: "t6", tokenNumber: "E-001", patientId: "p4", patientName: "Raj Mehta", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d1", departmentName: "Emergency", status: "waiting", position: 1, estimatedWait: "~5 min", createdAt: "2026-06-10T09:10:00", isEmergency: true },
{ id: "t7", tokenNumber: "A-005", patientId: "p5", patientName: "Kavita Singh", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d3", departmentName: "Orthopedics", status: "waiting", position: 3, estimatedWait: "~20 min", createdAt: "2026-06-10T08:45:00", isEmergency: false },
{ id: "t8", tokenNumber: "A-006", patientId: "p6", patientName: "Deepak Joshi", hospitalId: "h1", hospitalName: "City General Hospital", departmentId: "d2", departmentName: "Cardiology", status: "waiting", position: 3, estimatedWait: "~22 min", createdAt: "2026-06-10T08:50:00", isEmergency: false },
{ id: "t9", tokenNumber: "A-007", patientId: "p7", patientName: "Meera Nair", hospitalId: "h2", hospitalName: "St. Mary's Medical Center", departmentId: "d5", departmentName: "Neurology", status: "in-progress", position: 0, estimatedWait: "Now", createdAt: "2026-06-10T07:30:00", calledAt: "2026-06-10T08:45:00", isEmergency: false },
{ id: "t10", tokenNumber: "A-008", patientId: "p8", patientName: "Arjun Reddy", hospitalId: "h3", hospitalName: "Metro Health Institute", departmentId: "d7", departmentName: "General Medicine", status: "completed", position: 0, estimatedWait: "Done", createdAt: "2026-06-10T06:00:00", completedAt: "2026-06-10T07:30:00", isEmergency: false }];


export const MOCK_NOTIFICATIONS = [
{ id: "n1", title: "Token Called Soon", message: "Your token A-001 at Cardiology will be called in ~15 minutes.", type: "info", read: false, createdAt: "2026-06-10T09:15:00" },
{ id: "n2", title: "Appointment Confirmed", message: "Your appointment at St. Mary's Pediatrics was completed successfully.", type: "success", read: true, createdAt: "2026-06-09T11:00:00" },
{ id: "n3", title: "High Crowd Alert", message: "Metro Health Institute Emergency is experiencing high crowd levels.", type: "warning", read: false, createdAt: "2026-06-10T08:00:00" },
{ id: "n4", title: "Token Cancelled", message: "Your token B-005 at Emergency was cancelled.", type: "error", read: true, createdAt: "2026-06-08T14:30:00" }];


export const MOCK_CROWD_TREND = [
{ label: "6 AM", value: 15 },
{ label: "7 AM", value: 25 },
{ label: "8 AM", value: 45 },
{ label: "9 AM", value: 72 },
{ label: "10 AM", value: 88 },
{ label: "11 AM", value: 95 },
{ label: "12 PM", value: 78 },
{ label: "1 PM", value: 60 },
{ label: "2 PM", value: 70 },
{ label: "3 PM", value: 82 },
{ label: "4 PM", value: 75 },
{ label: "5 PM", value: 55 },
{ label: "6 PM", value: 35 },
{ label: "7 PM", value: 20 }];


export const MOCK_PEAK_HOURS = [
{ label: "Mon", value: 85 },
{ label: "Tue", value: 72 },
{ label: "Wed", value: 90 },
{ label: "Thu", value: 68 },
{ label: "Fri", value: 78 },
{ label: "Sat", value: 55 },
{ label: "Sun", value: 30 }];


export const MOCK_WAIT_TIMES = [
{ label: "0-10 min", value: 120 },
{ label: "10-20 min", value: 95 },
{ label: "20-30 min", value: 65 },
{ label: "30-45 min", value: 40 },
{ label: "45-60 min", value: 20 },
{ label: "60+ min", value: 8 }];


// ─── Helper Functions ────────────────────────────────────────

export function getHospitalById(id) {
  return MOCK_HOSPITALS.find((h) => h.id === id);
}

export function getDepartmentsByHospital(hospitalId) {
  return MOCK_DEPARTMENTS.filter((d) => d.hospitalId === hospitalId);
}

export function getTokensByPatient(patientId) {
  return MOCK_TOKENS.filter((t) => t.patientId === patientId);
}

export function getTokensByHospital(hospitalId) {
  return MOCK_TOKENS.filter((t) => t.hospitalId === hospitalId);
}

export function getQueueStats(hospitalId) {
  const tokens = hospitalId ? getTokensByHospital(hospitalId) : MOCK_TOKENS;
  return {
    totalWaiting: tokens.filter((t) => t.status === "waiting").length,
    inProgress: tokens.filter((t) => t.status === "in-progress").length,
    completed: tokens.filter((t) => t.status === "completed").length,
    avgWaitTime: "~18 min",
    emergencyCount: tokens.filter((t) => t.isEmergency && t.status === "waiting").length
  };
}

export function generateTokenNumber(prefix = "A") {
  const num = Math.floor(Math.random() * 999) + 1;
  return `${prefix}-${num.toString().padStart(3, "0")}`;
}