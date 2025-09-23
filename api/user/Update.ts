// api/user/Update.ts - Refactored
import type { VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import ValidationUtils from '../../services/validators/ValidationUtils';
import {
    findUserByEmail,
    updateUserDetails,
    checkUsernameExists,
    getUserProfile
} from '../../services/utils/Supabase';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

const updateUser = async (req: AuthenticatedRequest, res: VercelResponse) => {
  // Get email from JWT token (secure)
  const email = req.user.email;
  
  const {
    username,
    firstName,
    lastName,
    organisation,
    avatarURL
  } = req.body;

  console.log("email: ", email);

  // Check if user exists
  const existingUser = await findUserByEmail(email);
  if (!existingUser) {
    ResponseUtils.send(res, ResponseUtils.notFound('User not found'));
    return;
  }

  // Validate username uniqueness if provided
  if (username !== undefined) {
    if (username && !ValidationUtils.isValidUsername(username)) {
      ResponseUtils.send(res, ResponseUtils.error('Username must be 3-30 characters and contain only letters, numbers, and underscores', 400));
      return;
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        ResponseUtils.send(res, ResponseUtils.conflict('Username already taken'));
        return;
      }
    }
  }

  // Prepare update data
  const userData: { username?: string } = {};
  const profileData: {
    first_name?: string;
    last_name?: string;
    organisation?: string;
    avatar_url?: string;
  } = {};

  // User table updates
  if (username !== undefined) userData.username = username;

  // Profile table updates
  if (firstName !== undefined) profileData.first_name = firstName;
  if (lastName !== undefined) profileData.last_name = lastName;
  if (organisation !== undefined) profileData.organisation = organisation;
  if (avatarURL !== undefined) profileData.avatar_url = avatarURL;

  // Update user
  await updateUserDetails(email, userData, profileData);

  // Get updated user profile
  const updatedProfile = await getUserProfile(email);

  ResponseUtils.send(res, ResponseUtils.updated(updatedProfile, 'User details updated successfully'));
};

export default createHandler(updateUser, {
  requireAuth: true,
  allowedMethods: ['PUT', 'PATCH'],
  validator: Validators.userUpdate
});