import { Router } from "express";

export const examsRoutes = Router();

examsRoutes.get("/", (_req, res) => {
  res.status(501).json({ success: false, message: "Exams module not implemented yet" });
});
