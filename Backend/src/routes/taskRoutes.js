import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createTask,
    getAllTasks,
    getSingleTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } from "../controllers/taskController.js";

  import upload
from "../config/multer.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Task Routes
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    authMiddleware,
    roleMiddleware("MANAGER"),
    upload.single("attachment"),
    createTask
  );

router.get(
    "/",
    authMiddleware,
    getAllTasks
  );

  router.get(
    "/:id",
    authMiddleware,
    getSingleTask
  );

  router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    updateTask
  );
  
  router.patch(
    "/:id/status",
    authMiddleware,
    updateTaskStatus
  );

  router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    deleteTask
  );

export default router;