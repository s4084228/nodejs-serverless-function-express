// api/user/updateUserDetails.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    findUserByEmail,
    updateUserDetails,
    checkUsernameExists,
    getUserProfile
} from '../../services/utils/Supabase';
import ValidationUtils from '../../services/utils/ValidationUtils';
import { validateToken, AuthenticatedRequest } from '../../services/middleware/Auth';
interface UpdateUserRequest {
    email: string; // Required as identifier (cannot be changed)
    username?: string;
    firstName?: string;
    lastName?: string;
    organisation?: string;
    avatarURL?: string;
}

async function updateUser(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            email,
            username,
            firstName,
            lastName,
            organisation,
            avatarURL
        }: UpdateUserRequest = req.body;

        // Validate required email
        if (!email || !ValidationUtils.isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate username uniqueness if provided
        if (username !== undefined) {
            if (username && !ValidationUtils.isValidUsername(username)) {
                return res.status(400).json({
                    error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
                });
            }

            // Check if username is taken by another user
            if (username && username !== existingUser.username) {
                const usernameExists = await checkUsernameExists(username);
                if (usernameExists) {
                    return res.status(400).json({ error: 'Username already taken' });
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

        return res.status(200).json({
            success: true,
            message: 'User details updated successfully',
            user: updatedProfile
        });

    } catch (error) {
        console.error('Update user details error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default validateToken(updateUser);
