import prisma from "../config/prisma.js";

/*
|--------------------------------------------------------------------------
| User Dashboard Stats
|--------------------------------------------------------------------------
*/

export const getUserDashboardStats = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    /*
    |--------------------------------------------------------------------------
    | Total Tasks
    |--------------------------------------------------------------------------
    */

    const totalTasks = await prisma.task.count({
      where: {
        assignedToId: userId,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Completed Tasks
    |--------------------------------------------------------------------------
    */

    const completedTasks = await prisma.task.count({
      where: {
        assignedToId: userId,
        status: "COMPLETED",
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Pending Tasks
    |--------------------------------------------------------------------------
    */

    const pendingTasks = await prisma.task.count({
      where: {
        assignedToId: userId,
        NOT: {
          status: "COMPLETED",
        },
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Overdue Tasks
    |--------------------------------------------------------------------------
    */

    const overdueTasks = await prisma.task.count({
      where: {
        assignedToId: userId,

        dueDate: {
          lt: new Date(),
        },

        NOT: {
          status: "COMPLETED",
        },
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Joined Projects
    |--------------------------------------------------------------------------
    */

    const joinedProjects = await prisma.projectMember.count(
      {
        where: {
          userId,
        },
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        joinedProjects,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getManagerDashboardStats =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Total Users
      |--------------------------------------------------------------------------
      */

      const totalUsers = await prisma.user.count();

      /*
      |--------------------------------------------------------------------------
      | Total Projects
      |--------------------------------------------------------------------------
      */

      const totalProjects =
        await prisma.project.count();

      /*
      |--------------------------------------------------------------------------
      | Total Tasks
      |--------------------------------------------------------------------------
      */

      const totalTasks = await prisma.task.count();

      /*
      |--------------------------------------------------------------------------
      | Completed Tasks
      |--------------------------------------------------------------------------
      */

      const completedTasks =
        await prisma.task.count({
          where: {
            status: "COMPLETED",
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Pending Tasks
      |--------------------------------------------------------------------------
      */

      const pendingTasks =
        await prisma.task.count({
          where: {
            NOT: {
              status: "COMPLETED",
            },
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Overdue Tasks
      |--------------------------------------------------------------------------
      */

      const overdueTasks =
        await prisma.task.count({
          where: {
            dueDate: {
              lt: new Date(),
            },

            NOT: {
              status: "COMPLETED",
            },
          },
        });

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        data: {
          totalUsers,
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
        },
      });
    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };