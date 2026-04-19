import { Router } from "express";

export const gradesRoutes = Router();

gradesRoutes.get("/", (_req, res) => {
  res.status(501).json({ success: false, message: "Grades module not implemented yet" });
});
