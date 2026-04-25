const express = require("express");
const { body, param } = require("express-validator");
const adminController = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validate");

const router = express.Router();

router.get(
  "/dashboard-data/:id",
  requireAuth,
  requireRole("admin"),
  adminController.getDashboardData
);

router.post(
  "/grades/:id/validate",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.validateGrade
);

router.post(
  "/grades/:id/publish",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.publishGrade
);

router.post(
  "/correction-requests/:id/decision",
  requireAuth,
  requireRole("admin"),
  [
    param("id").isInt({ min: 1 }),
    body("decision").isIn(["Accepted", "Rejected"]),
    body("decisionNote").optional().isLength({ min: 3 }),
    validateRequest,
  ],
  adminController.processCorrectionRequest
);

router.get("/users", requireAuth, requireRole("admin"), adminController.getUsers);

router.post(
  "/users",
  requireAuth,
  requireRole("admin"),
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["student", "teacher", "admin"]),
    validateRequest,
  ],
  adminController.createUser
);

router.put(
  "/users/:id",
  requireAuth,
  requireRole("admin"),
  [
    param("id").isInt({ min: 1 }),
    body("password").optional().isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    validateRequest,
  ],
  adminController.updateUser
);

router.delete("/users/:id", requireAuth, requireRole("admin"), adminController.deleteUser);

router.get("/sessions", requireAuth, requireRole("admin"), adminController.getSessions);

router.post(
  "/sessions",
  requireAuth,
  requireRole("admin"),
  [
    body("subject").isLength({ min: 2 }),
    body("examType").isIn(["Exam", "DS", "CC", "Remedial"]),
    body("examDate").isISO8601(),
    body("teacherId").isInt({ min: 1 }),
    validateRequest,
  ],
  adminController.createSession
);

module.exports = router;
