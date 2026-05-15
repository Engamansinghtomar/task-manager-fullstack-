import { Router } from "express";

import authRoutes from "./authRoutes.js";

import projectRoutes from "./projectRoutes.js";

import taskRoutes from "./taskRoutes.js";

import dashboardRoutes from "./dashboardRoutes.js";

import userRoutes
from "./userRoutes.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Health Check Route
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API v1 is working",
  });
});

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/

router.use("/auth", authRoutes);

export default router;

router.use("/projects", projectRoutes);

router.use("/tasks", taskRoutes);

router.use("/dashboard", dashboardRoutes);

router.use("/users", userRoutes);