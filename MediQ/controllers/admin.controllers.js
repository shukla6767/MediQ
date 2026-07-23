const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const User = require("../models/User");

/**
 * ============================================================================
 * ADMIN CONTROLLERS
 * ============================================================================
 * What this file does:
 * Handles HTTP requests specifically for Super Admins (creating hospitals, departments,
 * and registering staff members). 
 * 
 * Data Flow:
 * - IN: Receives JSON body from the React frontend (e.g., `req.body.name`).
 * - ACTION: Validates input, interacts with Mongoose Models directly.
 * - OUT: Returns standard JSON responses using the `ApiResponse` utility.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HOSPITAL CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const addHospital = asyncHandler(async (req, res) => {
  const { name, address, phone, email, totalBeds, formattedAddress, googlePlaceId, location } = req.body;

  // Validation: Fail early if data is missing
  if (!name || !address || !phone || !email) {
    throw new ApiError(400, "Name, address, phone, and email are required");
  }

  const existingHospital = await Hospital.findOne({ email });
  if (existingHospital) {
    throw new ApiError(409, "Hospital with this email already exists");
  }

  const hospital = await Hospital.create({
    name,
    address,
    formattedAddress,
    googlePlaceId,
    location,
    phone,
    email,
    totalBeds: totalBeds || 0,
    availableBeds: totalBeds || 0, // Defaults available beds to total beds initially
  });

  return res.status(201).json(new ApiResponse(201, hospital, "Hospital created successfully"));
});

const updateHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // `runValidators: true` ensures Mongoose schema rules (like max length) apply to updates
  const hospital = await Hospital.findByIdAndUpdate(
    id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  return res.status(200).json(new ApiResponse(200, hospital, "Hospital updated successfully"));
});

const deleteHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hospital = await Hospital.findByIdAndDelete(id);

  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  // Cascading Delete: If a hospital is destroyed, we MUST destroy its departments too
  await Department.deleteMany({ hospital: id });

  return res.status(200).json(new ApiResponse(200, {}, "Hospital deleted successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENT CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

const addDepartment = asyncHandler(async (req, res) => {
  const { name, hospitalId, doctorSlots } = req.body;

  if (!name || !hospitalId) {
    throw new ApiError(400, "Department name and hospitalId are required");
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

  // Prevent duplicate departments in the same hospital (e.g., two "Cardiology" departments)
  const existingDept = await Department.findOne({ name, hospital: hospitalId });
  if (existingDept) {
    throw new ApiError(409, "This department already exists in this hospital");
  }

  const department = await Department.create({
    name,
    hospital: hospitalId,
    doctorSlots: doctorSlots || 1,
  });

  return res.status(201).json(new ApiResponse(201, department, "Department added successfully"));
});

const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, hospitalId, doctorSlots } = req.body;

  const department = await Department.findByIdAndUpdate(
    id,
    { $set: { name, hospital: hospitalId, doctorSlots } },
    { new: true, runValidators: true }
  );

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return res.status(200).json(new ApiResponse(200, department, "Department updated successfully"));
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findByIdAndDelete(id);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Department deleted successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// STAFF CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Admins use this to create internal accounts for Doctors and Receptionists.
 * Unlike public registration, this immediately grants high-level roles.
 */
const registerStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  // Strict role validation
  if (role !== "doctor" && role !== "receptionist") {
    throw new ApiError(400, "Role must be doctor or receptionist");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    phone,
    password, // Handled by Mongoose pre-save hook
    role,
  });

  // Strip password hash from response
  const createdUser = await User.findById(user._id).select("-password");

  return res.status(201).json(new ApiResponse(201, createdUser, `${role} registered successfully`));
});

module.exports = {
  addHospital,
  updateHospital,
  deleteHospital,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  registerStaff
};
