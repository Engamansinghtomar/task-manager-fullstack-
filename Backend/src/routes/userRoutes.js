import express from "express";

import { getAllUsers, deleteUser }
from "../controllers/userController.js";

import authMiddleware
from "../middleware/authMiddleware.js";

import roleMiddleware
from "../middleware/roleMiddleware.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Get All Users
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authMiddleware,
  roleMiddleware("MANAGER"),
  getAllUsers
);

/*
|--------------------------------------------------------------------------
| Delete User
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("MANAGER"),
  deleteUser
);

export default router;