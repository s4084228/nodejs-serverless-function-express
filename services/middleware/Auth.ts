// services/middleware/Auth.ts
import * as jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Define your JWT payload structure
export interface User {
    userId: number;
    email: string;
    sub: string;
    exp?: number;
    iat?: number;
}

// Extend VercelRequest to include user
export interface AuthenticatedRequest extends VercelRequest {
    user: User;
}

// Type for your authenticated handler
type AuthenticatedHandler = (
    req: AuthenticatedRequest,
    res: VercelResponse
) => void | Promise<void | VercelResponse>;

// Type for regular handler
type Handler = (
    req: VercelRequest,
    res: VercelResponse
) => void | Promise<void | VercelResponse>;

export const validateToken = (handler: AuthenticatedHandler): Handler => {
    return async (req: VercelRequest, res: VercelResponse) => {
        try {
            // CRITICAL FIX: Allow OPTIONS requests to pass through without auth
            if (req.method === 'OPTIONS') {
                return handler(req as AuthenticatedRequest, res);
            }

            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ 
                    success: false,
                    error: 'No token provided',
                    statusCode: 401
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as User;

            // Add user to request
            (req as AuthenticatedRequest).user = decoded;

            // Call your handler with typed request
            return handler(req as AuthenticatedRequest, res);
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                error: 'Invalid token',
                statusCode: 401
            });
        }
    };
};