export {};
/*
// api/auth/login.ts - Login with database verification
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../../services/utils/Supabase';
import { validateToken, AuthenticatedRequest } from '../../services/middleware/Auth';
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

function signToken(user: { user_id: number; email: string }) {
    return jwt.sign(
        {
            sub: user.user_id.toString(),
            email: user.email,
            userId: user.user_id
        },
        process.env.JWT_SECRET || "dev-secret",
        { expiresIn: "24h" }
    );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = loginSchema.parse(req.body);

        // Find user by email
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = signToken(user);

        // Prepare user response (without password)
        const profile = user.profile;
        const userResponse = {
            user_id: user.user_id,
            email: user.email,
            username: user.username,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            organisation: profile?.organisation,
            avatar_url: profile?.avatar_url,
            display_name: profile
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : user.username || user.email
        };

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        });

    } catch (error: any) {
        console.error('Login error:', error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        return res.status(500).json({
            error: 'Login failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
*/