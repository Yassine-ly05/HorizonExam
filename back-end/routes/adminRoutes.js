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
    body("decision").isIn(["Approved", "Accepted", "Rejected"]),
    body("decisionNote").optional().isLength({ min: 3 }),
    validateRequest,
  ],
  adminController.processCorrectionRequest
);

router.post(
  "/elimination-requests/:id/decision",
  requireAuth,
  requireRole("admin"),
  [
    param("id").isInt({ min: 1 }),
    body("decision").isIn(["Approved", "Accepted", "Rejected"]),
    body("decisionNote").optional().isLength({ min: 3 }),
    validateRequest,
  ],
  adminController.processEliminationRequest
);

router.get("/classes", requireAuth, requireRole("admin"), adminController.getClasses);

router.post(
  "/classes",
  requireAuth,
  requireRole("admin"),
  [body("name").isLength({ min: 2 }), validateRequest],
  adminController.createClass
);

router.put(
  "/classes/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), body("name").isLength({ min: 2 }), validateRequest],
  adminController.updateClass
);

router.delete(
  "/classes/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.deleteClass
);

router.get("/subjects", requireAuth, requireRole("admin"), adminController.getSubjects);

router.post(
  "/subjects",
  requireAuth,
  requireRole("admin"),
  [body("name").isLength({ min: 2 }), validateRequest],
  adminController.createSubject
);

router.put(
  "/subjects/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), body("name").isLength({ min: 2 }), validateRequest],
  adminController.updateSubject
);

router.delete(
  "/subjects/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.deleteSubject
);

router.get("/rooms", requireAuth, requireRole("admin"), adminController.getRooms);

router.post(
  "/rooms",
  requireAuth,
  requireRole("admin"),
  [body("name").isLength({ min: 1 }), validateRequest],
  adminController.createRoom
);

router.put(
  "/rooms/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), body("name").isLength({ min: 1 }), validateRequest],
  adminController.updateRoom
);

router.delete(
  "/rooms/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.deleteRoom
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

router.put(
  "/sessions/:id",
  requireAuth,
  requireRole("admin"),
  [
    param("id").isInt({ min: 1 }),
    body("subject").optional().isLength({ min: 2 }),
    body("examType").optional().isIn(["Exam", "DS", "CC", "Remedial"]),
    body("examDate").optional().isISO8601(),
    body("teacherId").optional().isInt({ min: 1 }),
    validateRequest,
  ],
  adminController.updateSession
);

router.delete(
  "/sessions/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  adminController.deleteSession
);

module.exports = router;
