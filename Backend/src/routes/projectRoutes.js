import { Router } from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    createProject,
    getAllProjects,
    getSingleProject,
    updateProject,
    deleteProject,
    addProjectMember,
    getProjectMembers,
    removeProjectMember,
  } from "../controllers/projectController.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Project Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  authMiddleware,
  roleMiddleware("MANAGER"),
  createProject
);

export default router;

router.get(
    "/",
    authMiddleware,
    getAllProjects
  );

  router.get(
    "/:id",
    authMiddleware,
    getSingleProject
  );

  router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    updateProject
  );

  router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("MANAGER"),
    deleteProject
  );

  router.post(
    "/:id/members",
    authMiddleware,
    roleMiddleware("MANAGER"),
    addProjectMember
  );

  router.get(
    "/:id/members",
    authMiddleware,
    getProjectMembers
  );

  router.delete(
    "/:id/members/:userId",
    authMiddleware,
    roleMiddleware("MANAGER"),
    removeProjectMember
  );