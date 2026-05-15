import prisma from "../config/prisma.js";

/*
|--------------------------------------------------------------------------
| Create Task
|--------------------------------------------------------------------------
*/

export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      assignedToId,
      dueDate,
      priority,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Attachment
    |--------------------------------------------------------------------------
    */

    const attachment =
      req.file
        ? `/uploads/${req.file.filename}`
        : null;

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (
      !projectId ||
      !title ||
      !description ||
      !assignedToId ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Project
    |--------------------------------------------------------------------------
    */

    const project =
      await prisma.project.findUnique({
        where: {
          id: Number(projectId),
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Assigned User
    |--------------------------------------------------------------------------
    */

    const user =
      await prisma.user.findUnique({
        where: {
          id: Number(
            assignedToId
          ),
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Assigned user not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check User Membership
    |--------------------------------------------------------------------------
    */

    const isMember =
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId:
              Number(projectId),

            userId:
              Number(
                assignedToId
              ),
          },
        },
      });

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message:
          "User is not a member of this project",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Task
    |--------------------------------------------------------------------------
    */

    const task =
      await prisma.task.create({
        data: {
          projectId:
            Number(projectId),

          title,

          description,

          assignedToId:
            Number(
              assignedToId
            ),

          dueDate:
            new Date(
              dueDate
            ),

          priority: priority || 'MEDIUM',

          attachment,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message:
        "Task created successfully",

      data: task,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        "Internal Server Error",
    });
  }
};

export const getAllTasks =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Get Tasks
      |--------------------------------------------------------------------------
      */

      const tasks =
        await prisma.task.findMany({
          where:
            req.user.role ===
            "MANAGER"
              ? {}
              : {
                  assignedToId:
                    req.user.id,
                },

          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },

            project: {
              select: {
                id: true,
                name: true,
                status: true,
            
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };

export const getSingleTask =
  async (req, res) => {
    try {
      const { id } = req.params;

      /*
      |--------------------------------------------------------------------------
      | Find Task
      |--------------------------------------------------------------------------
      */

      const task =
        await prisma.task.findUnique({
          where: {
            id: Number(id),
          },

          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },

            project: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
              },
            },
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Task Not Found
      |--------------------------------------------------------------------------
      */

      if (!task) {
        return res.status(404).json({
          success: false,
          message:
            "Task not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };

export const updateTask =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        assignedToId,
        dueDate,
        status,
        priority,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Check Task
      |--------------------------------------------------------------------------
      */

      const existingTask =
        await prisma.task.findUnique({
          where: {
            id: Number(id),
          },
        });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message:
            "Task not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Assigned User
      |--------------------------------------------------------------------------
      */

      if (assignedToId) {
        const user =
          await prisma.user.findUnique({
            where: {
              id: Number(
                assignedToId
              ),
            },
          });

        if (!user) {
          return res.status(404).json({
            success: false,
            message:
              "Assigned user not found",
          });
        }

        /*
        |--------------------------------------------------------------------------
        | Check Membership
        |--------------------------------------------------------------------------
        */

        const isMember =
          await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId:
                  existingTask.projectId,

                userId:
                  Number(
                    assignedToId
                  ),
              },
            },
          });

        if (!isMember) {
          return res.status(400).json({
            success: false,
            message:
              "User is not a member of this project",
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Update Task
      |--------------------------------------------------------------------------
      */

      const updatedTask =
        await prisma.task.update({
          where: {
            id: Number(id),
          },

          data: {
            title,

            description,

            assignedToId:
              assignedToId
                ? Number(
                    assignedToId
                  )
                : undefined,

            dueDate: dueDate
              ? new Date(
                  dueDate
                )
              : undefined,

            status,
            priority,
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        message:
          "Task updated successfully",

        data: updatedTask,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };

export const updateTaskStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const { status } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validate Status
      |--------------------------------------------------------------------------
      */

      const validStatuses = [
        "TODO",
        "IN_PROGRESS",
        "COMPLETED",
      ];

      if (
        !validStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task status",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Find Task
      |--------------------------------------------------------------------------
      */

      const task =
        await prisma.task.findUnique({
          where: {
            id: Number(id),
          },
        });

      if (!task) {
        return res.status(404).json({
          success: false,
          message:
            "Task not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Permission Check
      |--------------------------------------------------------------------------
      */

      const isManager =
        req.user.role ===
        "MANAGER";

      const isAssignedUser =
        task.assignedToId ===
        req.user.id;

      if (
        !isManager &&
        !isAssignedUser
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can update only your assigned tasks",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Update Status
      |--------------------------------------------------------------------------
      */

      const updatedTask =
        await prisma.task.update({
          where: {
            id: Number(id),
          },

          data: {
            status,
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        message:
          "Task status updated successfully",

        data: updatedTask,
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };

export const deleteTask =
  async (req, res) => {
    try {
      const { id } = req.params;

      /*
      |--------------------------------------------------------------------------
      | Check Task
      |--------------------------------------------------------------------------
      */

      const existingTask =
        await prisma.task.findUnique({
          where: {
            id: Number(id),
          },
        });

      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message:
            "Task not found",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Delete Task
      |--------------------------------------------------------------------------
      */

      await prisma.task.delete({
        where: {
          id: Number(id),
        },
      });

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,
        message:
          "Task deleted successfully",
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          "Internal Server Error",
      });
    }
  };