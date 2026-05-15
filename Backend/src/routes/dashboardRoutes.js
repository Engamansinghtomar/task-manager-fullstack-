import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  getUserDashboardStats,
  getManagerDashboardStats,
} from "../controllers/dashboardController.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/user",
  authMiddleware,
  getUserDashboardStats
);

router.get(
    "/manager",
    authMiddleware,
    roleMiddleware("MANAGER"),
    getManagerDashboardStats
  );
  
export default router;