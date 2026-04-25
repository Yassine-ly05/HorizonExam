const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");
const { validateRequest } = require("../middlewares/validate");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("role").isIn(["student", "teacher", "admin"]).withMessage("Role is invalid"),
    validateRequest,
  ],
  authController.login
);

router.get("/me", requireAuth, authController.me);

module.exports = router;
