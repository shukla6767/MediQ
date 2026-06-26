const { Router } = require("express");
const { addHospital, updateHospital, deleteHospital, addDepartment, updateDepartment, deleteDepartment, registerStaff } = require("../controllers/admin.controllers");
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");

const router = Router();

// Protect all admin routes with JWT and Admin check
router.use(verifyJWT, isAdmin);

// Staff routes
router.route("/staff/register").post(registerStaff);

// Hospital routes
router.route("/hospitals").post(addHospital);
router.route("/hospitals/:id").patch(updateHospital).delete(deleteHospital);

// Department routes
router.route("/departments").post(addDepartment);
router.route("/departments/:id").patch(updateDepartment).delete(deleteDepartment);

module.exports = router;
