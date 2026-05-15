import { Router } from "express";

import { signup, login } from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import roleMiddleware from "../middleware/roleMiddleware.js";



const router = Router();

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/

router.post("/signup", signup);

router.post("/login", login);

export default router;

router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Protected route accessed",
      user: req.user,
    });
  });

  router.get(
    "/manager-only",
    authMiddleware,
    roleMiddleware("MANAGER"),
    (req, res) => {
      return res.status(200).json({
        success: true,
        message: "Welcome Manager",
      });
    }
  );