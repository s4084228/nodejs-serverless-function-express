// services/middleware/Auth.ts
import * as jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Define your JWT payload structure
export interface User {
    userId: number;    // or user_id: number - match your JWT structure
    email: string;
    sub: string;
    exp?: number;
    iat?: number;
}

// Extend VercelRequest to include user
export interface AuthenticatedRequest extends VercelRequest {
    user: User;
}

// Type for your authenticated handler - FIXED return type
type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    res: VercelResponse
) => void | Promise<void | VercelResponse>;

// Type for regular handler - FIXED return type
type Handler = (
    req: VercelRequest,
    res: VercelResponse
) => void | Promise<void | VercelResponse>;

export const validateToken = (handler: AuthenticatedHandler): Handler => {
    return async (req: VercelRequest, res: VercelResponse) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as User;
            //const decoded = jwt.verify(token, process.env.JWT_SECRET!) as User;

            // Add user to request
            (req as AuthenticatedRequest).user = decoded;

            // Call your handler with typed request
            return handler(req as AuthenticatedRequest, res);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
};