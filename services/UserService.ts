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
import { UserTermsAcceptance } from './dto/UserTermsAcceptance';
import { UserNewsLetterSubs } from './dto/UserNewsLetterSubs';
import { createTermsAcceptance, hasAcceptedTerms } from './utils/supabaseUtils/UserTermsUtils';
import { createNewsletterSubscription, isSubscribedToNewsletter } from './utils/supabaseUtils/NewsletterUtils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function createUser(userData: UserData): Promise<UserResponse> {
    const { email, password, username, firstName, lastName, organisation, acceptTandC, newsLetterSubs } = userData;
    
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

        // Handle Terms and Conditions acceptance
        if (acceptTandC) {
            try {
                await createTermsAcceptance(email);
                console.log('Terms and conditions acceptance recorded successfully');
            } catch (termsError) {
                console.error('Terms acceptance failed:', termsError);
                // Don't fail the user creation, but log the error
                // In a production environment, you might want to handle this differently
            }
        }

        // Handle Newsletter subscription
        if (newsLetterSubs) {
            try {
                await createNewsletterSubscription(email);
                console.log('Newsletter subscription recorded successfully');
            } catch (newsletterError) {
                console.error('Newsletter subscription failed:', newsletterError);
                // Don't fail the user creation, but log the error
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



/*
// Create new user with profile
export async function createUser(userData: UserData): Promise<UserResponse> {
    const { email, password, username, firstName, lastName, organisation acceptTandC,newsLetterSubs} = userData;

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
}*/


// Additional utility function to handle post-registration terms and newsletter updates
export async function updateUserPreferences(
    email: string, 
    acceptTandC?: boolean, 
    newsLetterSubs?: boolean
): Promise<void> {
    try {
        // Handle Terms and Conditions acceptance
        if (acceptTandC === true) {
            try {
                await createTermsAcceptance(email);
            } catch (error) {
                if (error.message === 'TERMS_ALREADY_ACCEPTED') {
                    console.log('Terms already accepted by user');
                } else {
                    throw error;
                }
            }
        }

        // Handle Newsletter subscription
        if (newsLetterSubs === true) {
            try {
                await createNewsletterSubscription(email);
            } catch (error) {
                if (error.message === 'NEWSLETTER_ALREADY_SUBSCRIBED') {
                    console.log('User already subscribed to newsletter');
                } else {
                    throw error;
                }
            }
        } else if (newsLetterSubs === false) {
            // Unsubscribe from newsletter
            try {
                const { unsubscribeFromNewsletter } = await import('./NewsletterUtils');
                await unsubscribeFromNewsletter(email);
            } catch (error) {
                console.error('Failed to unsubscribe from newsletter:', error);
                throw new Error('Failed to update newsletter preferences');
            }
        }

    } catch (error) {
        console.error('Error updating user preferences:', error);
        throw new Error('Failed to update user preferences');
    }
}

// Function to get user's current preferences
export async function getUserPreferences(email: string): Promise<{
    hasAcceptedTerms: boolean;
    isSubscribedToNewsletter: boolean;
}> {
    try {
        const { hasAcceptedTerms } = await import('./UserTermsUtils');
        const { isSubscribedToNewsletter } = await import('./NewsletterUtils');

        const [termsAccepted, newsletterSubscribed] = await Promise.all([
            hasAcceptedTerms(email),
            isSubscribedToNewsletter(email)
        ]);

        return {
            hasAcceptedTerms: termsAccepted,
            isSubscribedToNewsletter: newsletterSubscribed
        };
    } catch (error) {
        console.error('Error getting user preferences:', error);
        throw new Error('Failed to get user preferences');
    }
}