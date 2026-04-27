const express = require("express");
const { body, param } = require("express-validator");
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
    body("examSessionId").optional().isInt({ min: 1 }),
    body("sessionId").optional().isInt({ min: 1 }),
    body("semester").isInt({ min: 1, max: 2 }),
    body("grade").isFloat({ min: 0, max: 20 }),
    validateRequest,
  ],
  teacherController.submitGrade
);

router.delete(
  "/grades/:id",
  requireAuth,
  requireRole("teacher"),
  [param("id").isInt({ min: 1 }), validateRequest],
  teacherController.deleteGrade
);

router.post(
  "/attendance",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").optional().isInt({ min: 1 }),
    body("sessionId").optional().isInt({ min: 1 }),
    body("status").isIn(["Present", "Absent"]),
    validateRequest,
  ],
  teacherController.submitAttendance
);

router.delete(
  "/attendance/:id",
  requireAuth,
  requireRole("teacher"),
  [param("id").isInt({ min: 1 }), validateRequest],
  teacherController.deleteAttendance
);

router.post(
  "/absences",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").optional().isInt({ min: 1 }),
    body("sessionId").optional().isInt({ min: 1 }),
    validateRequest,
  ],
  (req, res, next) => {
    req.body.status = "Absent";
    return teacherController.submitAttendance(req, res, next);
  }
);

router.post(
  "/reports",
  requireAuth,
  requireRole("teacher"),
  [
    body("examSessionId").optional().isInt({ min: 1 }),
    body("sessionId").optional().isInt({ min: 1 }),
    body("reportText").isLength({ min: 10 }),
    validateRequest,
  ],
  teacherController.submitReport
);

router.post(
  "/eliminations",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").optional().isInt({ min: 1 }),
    body("sessionId").optional().isInt({ min: 1 }),
    body("reason").isLength({ min: 5 }),
    validateRequest,
  ],
  teacherController.submitEliminationRequest
);

module.exports = router;
