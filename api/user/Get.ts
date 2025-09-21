// api/user/details.ts - Correct GET implementation
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getUserProfile } from '../../services/utils/Supabase';
import { validateToken, AuthenticatedRequest } from '../../services/middleware/Auth';

async function getUser(req: AuthenticatedRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user from JWT token (secure way)
    const user = req.user;
   

    try {
        // Use email from JWT token, not request body
        const userDetails = await getUserProfile(user.email);

        if (!userDetails) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: userDetails
        });
    } catch (error) {
        console.error('Get user details error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
export default validateToken(getUser);
