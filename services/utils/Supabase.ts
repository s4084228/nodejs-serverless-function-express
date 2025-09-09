// utils/Supabase.ts - Database functions for Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.TOC_SUPABASE_URL!;
const supabaseServiceKey = process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types
export interface User {
    id: number;
    email: string;
    password?: string;
}

export interface PasswordResetToken {
    id: number;
    user_id: number;
    email: string;
    token: string;
    expires_at: string;
    created_at: string;
}

export interface StoreTokenParams {
    userId: number;
    email: string;
    token: string;
    expiresAt: Date;
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding user by email:', error);
        return null;
    }
}

// Store password reset token
export async function storePasswordResetToken({
    userId,
    email,
    token,
    expiresAt
}: StoreTokenParams): Promise<PasswordResetToken | null> {
    try {
        // First, delete any existing tokens for this email
        await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('email', email);

        // Insert new token
        const { data, error } = await supabase
            .from('password_reset_tokens')
            .insert({
                user_id: userId,
                email: email,
                token: token,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error storing reset token:', error);
        throw error;
    }
}

// Find valid reset token
export async function findValidResetToken(
    email: string,
    token: string
): Promise<PasswordResetToken | null> {
    try {
        const { data, error } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('email', email)
            .eq('token', token)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding valid reset token:', error);
        return null;
    }
}

// Update user password
export async function updateUserPassword(
    userId: number,
    hashedPassword: string
): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating user password:', error);
        throw error;
    }
}

// Delete reset token
export async function deleteResetToken(tokenId: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('password_reset_tokens')
            .delete()
            .eq('id', tokenId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting reset token:', error);
        throw error;
    }
}

// Clean up expired tokens (optional - run periodically)
export async function cleanupExpiredTokens(): Promise<void> {
    try {
        const { error } = await supabase
            .from('password_reset_tokens')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) throw error;
    } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
    }
}