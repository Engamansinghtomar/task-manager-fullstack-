import prisma from "../config/prisma.js";

/*
|--------------------------------------------------------------------------
| Create Project
|--------------------------------------------------------------------------
*/

export const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Project
    |--------------------------------------------------------------------------
    */

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        createdById: req.user.id,
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllProjects = async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Get Projects
      |--------------------------------------------------------------------------
      */
  
      const projects = await prisma.project.findMany({
        where:
          req.user.role === "MANAGER"
            ? {}
            : {
                members: {
                  some: {
                    userId: req.user.id,
                  },
                },
              },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          tasks: {
            select: {
              id: true,
              status: true
            }
          }
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
        count: projects.length,
        data: projects,
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const getSingleProject = async (req, res) => {
    try {
      const { id } = req.params;
  
      /*
      |--------------------------------------------------------------------------
      | Find Project
      |--------------------------------------------------------------------------
      */
  
      const project = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
  
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
  
      /*
      |--------------------------------------------------------------------------
      | Project Not Found
      |--------------------------------------------------------------------------
      */
  
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */
  
      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const updateProject = async (req, res) => {
    try {
      const { id } = req.params;
  
      const { name, description, status } = req.body;
  
      /*
      |--------------------------------------------------------------------------
      | Check Project
      |--------------------------------------------------------------------------
      */
  
      const existingProject = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Update Project
      |--------------------------------------------------------------------------
      */
  
      const updatedProject = await prisma.project.update({
        where: {
          id: Number(id),
        },
  
        data: {
          name,
          description,
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
        message: "Project updated successfully",
        data: updatedProject,
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const deleteProject = async (req, res) => {
    try {
      const { id } = req.params;
  
      /*
      |--------------------------------------------------------------------------
      | Check Project
      |--------------------------------------------------------------------------
      */
  
      const existingProject = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Delete Project
      |--------------------------------------------------------------------------
      */
  
      await prisma.project.delete({
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
        message: "Project deleted successfully",
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const addProjectMember = async (req, res) => {
    try {
      const { id } = req.params;
  
      const { userId } = req.body;
  
      /*
      |--------------------------------------------------------------------------
      | Validate Input
      |--------------------------------------------------------------------------
      */
  
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Check Project
      |--------------------------------------------------------------------------
      */
  
      const project = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Check User
      |--------------------------------------------------------------------------
      */
  
      const user = await prisma.user.findUnique({
        where: {
          id: Number(userId),
        },
      });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Prevent Duplicate Members
      |--------------------------------------------------------------------------
      */
  
      const existingMember =
        await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: Number(id),
              userId: Number(userId),
            },
          },
        });
  
      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: "User already added to project",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Add Member
      |--------------------------------------------------------------------------
      */
  
      const member = await prisma.projectMember.create({
        data: {
          projectId: Number(id),
          userId: Number(userId),
        },
      });
  
      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */
  
      return res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: member,
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const getProjectMembers = async (req, res) => {
    try {
      const { id } = req.params;
  
      /*
      |--------------------------------------------------------------------------
      | Check Project
      |--------------------------------------------------------------------------
      */
  
      const project = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Get Members
      |--------------------------------------------------------------------------
      */
  
      const members = await prisma.projectMember.findMany({
        where: {
          projectId: Number(id),
        },
  
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
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
        count: members.length,
        data: members,
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export const removeProjectMember = async (req, res) => {
    try {
      const { id, userId } = req.params;
  
      /*
      |--------------------------------------------------------------------------
      | Check Project
      |--------------------------------------------------------------------------
      */
  
      const project = await prisma.project.findUnique({
        where: {
          id: Number(id),
        },
      });
  
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Check Membership
      |--------------------------------------------------------------------------
      */
  
      const member =
        await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: Number(id),
              userId: Number(userId),
            },
          },
        });
  
      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found in this project",
        });
      }
  
      /*
      |--------------------------------------------------------------------------
      | Remove Member
      |--------------------------------------------------------------------------
      */
  
      await prisma.projectMember.delete({
        where: {
          id: member.id,
        },
      });
  
      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */
  
      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };