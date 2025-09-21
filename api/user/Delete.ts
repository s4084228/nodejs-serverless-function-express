// api/user/deleteUser.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
    findUserByEmail,
    deleteUser as deleteUserFromDB,
    deleteUserAvatar
} from '../../services/utils/Supabase';
import ValidationUtils from '../../services/utils/ValidationUtils';
import { validateToken, AuthenticatedRequest } from '../../services/middleware/Auth';
interface DeleteUserRequest {
    email: string;
    confirmDelete: boolean;
}

async function deleteUser(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, confirmDelete }: DeleteUserRequest = req.body;

        // Validate required fields
        if (!email || !ValidationUtils.isValidEmail(email)) {
            return res.status(400).json({ error: 'Valid email is required' });
        }

        if (!confirmDelete) {
            return res.status(400).json({
                error: 'Account deletion must be confirmed by setting confirmDelete to true'
            });
        }

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user avatar if exists
        if (existingUser.profile?.avatar_url) {
            try {
                await deleteUserAvatar(existingUser.profile.avatar_url);
            } catch (avatarError) {
                console.warn('Failed to delete user avatar:', avatarError);
                // Continue with user deletion even if avatar deletion fails
            }
        }

        // Delete user from database (cascades to UserProfile)
        await deleteUserFromDB(existingUser.user_id);

        return res.status(200).json({
            success: true,
            message: 'User account deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
export default validateToken(deleteUser);
