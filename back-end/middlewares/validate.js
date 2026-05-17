const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: "Validation error",
    errors: errors.array().map((item) => ({
      field: item.path,
      message: item.msg,
    })),
  });
}

module.exports = { validateRequest };
