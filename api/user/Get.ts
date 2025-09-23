// api/user/Get.ts - Refactored
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { getUserProfile } from '../../services/UserService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

const getUser = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // Get user from JWT token (secure way)
  const user = req.user;

  // Use email from JWT token, not request body
  const userDetails = await getUserProfile(user.email);

  if (!userDetails) {
    ResponseUtils.send(res, ResponseUtils.notFound('User not found'));
    return;
  }

  ResponseUtils.send(res, ResponseUtils.success(userDetails, 'User details retrieved successfully'));
};

export default createHandler(getUser, {
  requireAuth: true,
  allowedMethods: ['GET']
});