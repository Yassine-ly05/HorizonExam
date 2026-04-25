const express = require("express");
const { body } = require("express-validator");
const teacherController = require("../controllers/teacherController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validate");

const router = express.Router();

router.get(
  "/dashboard-data/:id",
  requireAuth,
  requireRole("teacher"),
  teacherController.getDashboardData
);

router.post(
  "/grades",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").isInt({ min: 1 }),
    body("semester").isInt({ min: 1, max: 2 }),
    body("grade").isFloat({ min: 0, max: 20 }),
    validateRequest,
  ],
  teacherController.submitGrade
);

router.post(
  "/attendance",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").isInt({ min: 1 }),
    body("status").isIn(["Present", "Absent"]),
    validateRequest,
  ],
  teacherController.submitAttendance
);

router.post(
  "/reports",
  requireAuth,
  requireRole("teacher"),
  [
    body("examSessionId").isInt({ min: 1 }),
    body("reportText").isLength({ min: 10 }),
    validateRequest,
  ],
  teacherController.submitReport
);

module.exports = router;
