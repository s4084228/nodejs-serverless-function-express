// services/utils/UserService.ts - Database operations for user management
import {
    findUserByEmail,
    checkUsernameExists as checkUsernameInDB,
    updateUserDetails
} from './utils/Supabase';
import {UserProfile} from './dto/UserProfile';
import {CompleteUser} from './dto/CompleteUser';
import {User} from './dto/User';
import {UserData} from './entities/user/UserData';
import UserResponse from '../services/entities/user/UserResponse';
import ValidationUtils from './validators/ValidationUtils';  
import { getUserProfile as getSupabaseUserProfile } from './utils/Supabase';

// Check if email exists
export async function checkEmailExists(email: string): Promise<boolean> {
    try {
        const user = await findUserByEmail(email);
        return !!user;
    } catch (error) {
        console.error('Error checking email existence:', error);
        return false;
    }
}

// Check if username exists
export async function checkUsernameExists(username: string): Promise<boolean> {
    try {
        return await checkUsernameInDB(username);
    } catch (error) {
        console.error('Error checking username existence:', error);
        return false;
    }
}

// Get User Details
export async function getUserProfile(email: string): Promise<UserResponse | null> {
    try {
        const user = await getSupabaseUserProfile(email);
        if (!user) return null;
        
        return user; // Already in the correct UserResponse format
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw new Error('Failed to get user profile');
    }
}

// Create new user with profile
export async function createUser(userData: UserData): Promise<UserResponse> {
    const { email, password, username, firstName, lastName, organisation } = userData;

    try {
        // Hash password
        const passwordHash = await ValidationUtils.hashPassword(password);

        // Create user in User table
        const { data: newUser, error: userError } = await supabase
            .from('User')
            .insert({
                email: email.toLowerCase(),
                username: username || null,
                password_hash: passwordHash,
                created_at: new Date().toISOString()
            })
            .select('*')
            .single();

        if (userError) {
            if (userError.code === '23505') { // Unique constraint violation
                if (userError.message.includes('email')) {
                    throw new Error('EMAIL_TAKEN');
                }
                if (userError.message.includes('username')) {
                    throw new Error('USERNAME_TAKEN');
                }
            }
            throw userError;
        }

        // Create profile in UserProfile table (if profile data provided)
        if (firstName || lastName || organisation) {
            const { error: profileError } = await supabase
                .from('UserProfile')
                .insert({
                    email: email.toLowerCase(),
                    first_name: firstName || null,
                    last_name: lastName || null,
                    organisation: organisation || null,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                // If profile creation fails, we should ideally rollback user creation
                // For now, log the error but don't fail the registration
                console.error('Profile creation failed:', profileError);
            }
        }

        // Get complete user data
        const completeUser = await findUserByEmail(email);

        if (!completeUser) {
            throw new Error('Failed to retrieve created user');
        }

        // Format response
        const profile = completeUser.profile;
        const displayName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : completeUser.username || completeUser.email;

        return {
            userId: completeUser.user_id,
            email: completeUser.email,
            username: completeUser.username,
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            organisation: profile?.organisation,
            avatarUrl: profile?.avatar_url,
            displayName: displayName || completeUser.email,
            createdAt: completeUser.created_at
        };

    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Import supabase client (add this import)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);