// services/utils/Supabase.ts

import { createClient } from '@supabase/supabase-js';
import {UserProfile} from '../dto/UserProfile';
import {CompleteUser} from '../dto/CompleteUser';
import {User} from '../dto/User';
import {PasswordResetToken} from '../dto/PasswordResetToken';
import UserResponse from '../../services/entities/user/UserResponse';


const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);




// Find user by email (joins with profile)
export async function findUserByEmail(email: string): Promise<CompleteUser | null> {
    try {
        const { data, error } = await supabase
            .from('User')
            .select(`
        *,
        profile:UserProfile(*)
      `)
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            throw error;
        }

        return {
            ...data,
            profile: data.profile || null
        };
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw new Error('Failed to find user');
    }
}

// Find user by ID (joins with profile)
export async function findUserById(userId: number): Promise<CompleteUser | null> {
    try {
        const { data, error } = await supabase
            .from('User')
            .select(`
        *,
        profile:UserProfile(*)
      `)
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            throw error;
        }

        return {
            ...data,
            profile: data.profile || null
        };
    } catch (error) {
        console.error('Error finding user by ID:', error);
        throw new Error('Failed to find user');
    }
}

// Check if username exists
export async function checkUsernameExists(username: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('User')
            .select('user_id')
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return false;
            }
            throw error;
        }

        return !!data;
    } catch (error) {
        console.error('Error checking username existence:', error);
        throw new Error('Failed to check username');
    }
}

// Update user details (updates both User and UserProfile tables)
export async function updateUserDetails(
    email: string,
    userData?: Partial<Pick<User, 'username'>>,
    profileData?: Partial<UserProfile>
): Promise<CompleteUser> {
    try {
        // Start a transaction-like operation
        let updatedUser: User;

        // Update User table if userData provided
        if (userData && Object.keys(userData).length > 0) {
            const { data, error } = await supabase
                .from('User')
                .update(userData)
                .eq('email', email)
                .select('*')
                .single();

            if (error) throw error;
            updatedUser = data;
        } else {
            // Get current user data
            const { data, error } = await supabase
                .from('User')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            updatedUser = data;
        }

        // Update or create UserProfile
        if (profileData && Object.keys(profileData).length > 0) {
            const { error: profileError } = await supabase
                .from('UserProfile')
                .upsert({
                    email,
                    ...profileData,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;
        }

        // Return complete user with profile
        return await findUserByEmail(email) as CompleteUser;
    } catch (error) {
        console.error('Error updating user details:', error);
        throw new Error('Failed to update user details');
    }
}

// Update user password
export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('User')
            .update({ password_hash: passwordHash })
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating user password:', error);
        throw new Error('Failed to update password');
    }
}

// Delete user (cascades to UserProfile automatically)
export async function deleteUser(userId: number): Promise<void> {
    try {
        // Delete related password reset tokens first
        await supabase
            .from('PasswordResetTokens')
            .delete()
            .eq('user_id', userId);

        // Delete user (UserProfile will be deleted automatically due to CASCADE)
        const { error } = await supabase
            .from('User')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error('Failed to delete user');
    }
}

// Delete user avatar from storage
export async function deleteUserAvatar(avatarUrl: string): Promise<void> {
    try {
        // Extract file path from URL
        const url = new URL(avatarUrl);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const filePath = `avatars/${fileName}`;

        const { error } = await supabase.storage
            .from('UserAvatars')
            .remove([filePath]);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting user avatar:', error);
        throw new Error('Failed to delete user avatar');
    }
}

// Get user profile for display
export async function getUserProfile(email: string): Promise<UserResponse | null> {
    try {
        const user = await findUserByEmail(email);

        if (!user) return null;

        const profile = user.profile;
        const displayName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : user.username || user.email;

        return {
            userId: user.user_id,
            email: user.email,
            username: user.username,
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            organisation: profile?.organisation,
            avatarUrl: profile?.avatar_url,
            displayName: displayName || user.email,
            createdAt: user.created_at
        };
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw new Error('Failed to get user profile');
    }
}

// Password reset token functions (existing functionality)
export async function storePasswordResetToken(tokenData: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
}): Promise<void> {
    try {
        const { error } = await supabase
            .from('PasswordResetTokens')
            .insert({
                user_id: tokenData.userId,
                email: tokenData.email,
                token: tokenData.token,
                expires_at: tokenData.expiresAt.toISOString()
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error storing password reset token:', error);
        throw new Error('Failed to store reset token');
    }
}

export async function findValidResetToken(
    email: string,
    token: string
): Promise<PasswordResetToken | null> {
    try {
        const { data, error } = await supabase
            .from('PasswordResetTokens')
            .select('*')
            .eq('email', email)
            .eq('token', token)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding reset token:', error);
        throw new Error('Failed to find reset token');
    }
}

export async function deleteResetToken(tokenId: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('PasswordResetTokens')
            .delete()
            .eq('id', tokenId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting reset token:', error);
        throw new Error('Failed to delete reset token');
    }
}