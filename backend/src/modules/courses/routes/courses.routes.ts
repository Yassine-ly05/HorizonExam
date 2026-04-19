import { Router } from "express";

export const coursesRoutes = Router();

coursesRoutes.get("/", (_req, res) => {
  res.status(501).json({ success: false, message: "Courses module not implemented yet" });
});
