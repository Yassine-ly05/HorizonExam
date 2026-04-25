const express = require("express");
const { body } = require("express-validator");
const studentController = require("../controllers/studentController");
const { requireAuth, requireRole } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validate");

const router = express.Router();

router.get(
  "/dashboard-data/:id",
  requireAuth,
  requireRole("student"),
  studentController.getDashboardData
);

router.get(
  "/correction-requests",
  requireAuth,
  requireRole("student"),
  studentController.getCorrectionRequests
);

router.post(
  "/correction-requests",
  requireAuth,
  requireRole("student"),
  [
    body("resultId").isInt({ min: 1 }).withMessage("Valid resultId is required"),
    body("reason").isLength({ min: 10 }).withMessage("Reason must contain at least 10 characters"),
    validateRequest,
  ],
  studentController.submitCorrectionRequest
);

module.exports = router;
