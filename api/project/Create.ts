// api/project/Create.ts - Use the refactored version
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import ValidationUtils from '../../services/validators/ValidationUtils';
import { ProjectService } from '../../services/ProjectService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';
import ProjectData from "../../services/entities/project/ProjectData"

const createProject = async (req: AuthenticatedRequest, res: VercelResponse) => {
  const requestData = req.body;

  // Auth check - ensure user can only create projects for themselves
  /*if (req.user.userId.toString() !== requestData.userId) {
    ResponseUtils.send(res, ResponseUtils.unauthorized('Authentication Failed'));
    return;
  }*/
  requestData.userId = req.user.userId.toString();
  // Additional field format validation
  const fieldErrors = ValidationUtils.validateFieldFormats(requestData);
  if (fieldErrors.length > 0) {
    ResponseUtils.send(res, ResponseUtils.validationError(fieldErrors));
    return;
  }

  // Additional project-specific validation for create
  const projectErrors = ValidationUtils.validateProjectForCreate(requestData);
  if (projectErrors.length > 0) {
    ResponseUtils.send(res, ResponseUtils.validationError(projectErrors));
    return;
  }

  // Business logic - create project

  const result: ProjectData = await ProjectService.createProject(requestData);
  ResponseUtils.send(res, ResponseUtils.created(result, 'Project created and saved to MongoDB'));
};

export default createHandler(createProject, {
  requireAuth: true,
  allowedMethods: ['POST'],
  validator: Validators.createProject
});