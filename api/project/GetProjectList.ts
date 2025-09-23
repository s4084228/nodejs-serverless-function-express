// api/project/GetProjectList.ts - Refined
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { ProjectService } from '../../services/ProjectService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

const getProjectList = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // Get userId from JWT token (secure)
  const userId = req.user.userId.toString();

  // Get all projects for the user
  const projects = await ProjectService.listUserProjects(userId);

  // Extract only project names and IDs
  const projectList = projects.map((project, index) => ({
    projectId: project.projectId,
    projectName: project.tocData?.projectTitle || `Project ${index + 1}`,
  }));

  // Sort by project name alphabetically
  projectList.sort((a, b) => a.projectName.localeCompare(b.projectName));

  const result = {
    projects: projectList,
    count: projectList.length
  };

  ResponseUtils.send(res, ResponseUtils.success(result, 'Project list retrieved successfully'));
};

export default createHandler(getProjectList, {
  requireAuth: true,
  allowedMethods: ['GET']
});