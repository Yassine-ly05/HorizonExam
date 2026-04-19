import { Router } from "express";

export const usersRoutes = Router();

usersRoutes.get("/", (_req, res) => {
  res.status(501).json({ success: false, message: "Users module not implemented yet" });
});
