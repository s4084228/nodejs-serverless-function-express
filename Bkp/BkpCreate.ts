export {};
/*
// api/auth/register.ts - Serverless registration with Supabase
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import ValidationUtils from '../../services/validators/ValidationUtils';
import { createUser, checkEmailExists, checkUsernameExists } from '../../services/utils/UserService';

// Registration schema validation
const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    firstName: z.string().min(1, 'First name cannot be empty').optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').optional(),
    organisation: z.string().optional(),
});

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
        // Validate request body
        const validatedData = registerSchema.parse(req.body);
        const { email, password, username, firstName, lastName, organisation } = validatedData;

        // Additional password validation
        const passwordValidation = ValidationUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ error: passwordValidation.message });
        }

        // Additional username validation if provided
        if (username && !ValidationUtils.isValidUsername(username)) {
            return res.status(400).json({
                error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
            });
        }

        // Check if email already exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Check if username already exists (if provided)
        if (username) {
            const usernameExists = await checkUsernameExists(username);
            if (usernameExists) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        // Create user and profile
        const newUser = await createUser({
            email,
            password,
            username,
            firstName,
            lastName,
            organisation
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });

    } catch (error: any) {
        console.error('Registration error:', error);

        // Handle Zod validation errors
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Handle specific database errors
        if (error.message.includes('EMAIL_TAKEN')) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        if (error.message.includes('USERNAME_TAKEN')) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        return res.status(500).json({
            error: 'Failed to register user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
*/


