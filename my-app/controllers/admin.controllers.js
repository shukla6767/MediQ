const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const User = require("../models/User");

// --- Hospital Controllers ---

const addHospital = asyncHandler(async (req, res) => {
  const { name, address, phone, email, totalBeds } = req.body;

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
    phone,
    email,
    totalBeds: totalBeds || 0,
    availableBeds: totalBeds || 0,
  });

  return res.status(201).json(new ApiResponse(201, hospital, "Hospital created successfully"));
});

const updateHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
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

  // Also delete all departments associated with this hospital
  await Department.deleteMany({ hospital: id });

  return res.status(200).json(new ApiResponse(200, {}, "Hospital deleted successfully"));
});

// --- Department Controllers ---

const addDepartment = asyncHandler(async (req, res) => {
  const { name, hospitalId, doctorSlots } = req.body;

  if (!name || !hospitalId) {
    throw new ApiError(400, "Department name and hospitalId are required");
  }

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new ApiError(404, "Hospital not found");
  }

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

// --- Staff Controllers ---

const registerStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

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
