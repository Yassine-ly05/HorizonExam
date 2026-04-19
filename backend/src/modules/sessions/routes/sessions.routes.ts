import { Router } from "express";

export const sessionsRoutes = Router();

sessionsRoutes.get("/", (_req, res) => {
  res.status(501).json({ success: false, message: "Sessions module not implemented yet" });
});
