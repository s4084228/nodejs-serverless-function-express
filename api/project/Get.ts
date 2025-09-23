// api/project/Get.ts - Refactored
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { ProjectService } from '../../services/ProjectService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

import ProjectData from "../../services/entities/project/ProjectData"



const getProject = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // Get userId from JWT token (secure)
  const userId = req.user.userId.toString();
  const email = req.user.email;
  const { projectId, type, status, limit = 10, page = 1 } = req.query;
  
  console.log("userId: ", userId);
  console.log("email: ", email);

  
let projects: ProjectData[] = [];

  // If projectId is provided, get specific project
  if (projectId && typeof projectId === 'string') {
    const project = await ProjectService.getProjectById(userId, projectId);
    if (!project) {
      ResponseUtils.send(res, ResponseUtils.notFound('Project not found'));
      return;
    }
    projects = [project];
  } else {
    // Get all projects for the user
    projects = await ProjectService.listUserProjects(userId);
  }

  // Apply filters
  if (type && typeof type === 'string') {
    projects = projects.filter(project => project.type === type);
  }

  if (status && typeof status === 'string') {
    projects = projects.filter(project => project.status === status);
  }

  // Sort by created_at descending (most recent first)
  projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedProjects = projects.slice(startIndex, endIndex);
  const totalProjects = projects.length;

  const result = {
    //userId: userId,
    projects: paginatedProjects,
    pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalProjects,
        totalPages: Math.ceil(totalProjects / limitNum)
    }
};

  ResponseUtils.send(res, ResponseUtils.success(result, 'Projects retrieved successfully'));
};

export default createHandler(getProject, {
  requireAuth: true,
  allowedMethods: ['GET']
});