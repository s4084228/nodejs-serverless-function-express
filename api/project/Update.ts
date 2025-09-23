// api/project/Update.ts - Refactored
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import ValidationUtils from '../../services/validators/ValidationUtils';
import { ProjectService } from '../../services/ProjectService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

const updateProject = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // Get userId from JWT token (secure)
  const userId = req.user.userId.toString();
  const requestData = req.body;

  // Add userId from JWT to request data
  const projectData = {
    ...requestData,
    userId: userId
  };

  // Validate field formats and types
  const formatErrors = ValidationUtils.validateProjectForUpdate(projectData);
  if (formatErrors.length > 0) {
    ResponseUtils.send(res, ResponseUtils.validationError(formatErrors));
    return;
  }

  // Additional format validation
  const fieldFormatErrors = ValidationUtils.validateFieldFormats(projectData);
  if (fieldFormatErrors.length > 0) {
    ResponseUtils.send(res, ResponseUtils.validationError(fieldFormatErrors));
    return;
  }

  // Update project using service
  const result = await ProjectService.updateProject(projectData);

  ResponseUtils.send(res, ResponseUtils.updated(result, 'Project updated successfully'));
};

export default createHandler(updateProject, {
  requireAuth: true,
  allowedMethods: ['PUT'],
  validator: Validators.updateProject
});