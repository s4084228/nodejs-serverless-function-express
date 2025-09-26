// services/utils/UserTermsUtils.ts

import { UserTermsAcceptance } from '../../dto/UserTermsAcceptance';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);



// Create terms acceptance record
export async function createTermsAcceptance(email: string): Promise<UserTermsAcceptance> {
    try {
        const acceptanceData = {
            email: email.toLowerCase(),
            accepted_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('UserTermsAcceptance')
            .insert(acceptanceData)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('TERMS_ALREADY_ACCEPTED');
            }
            throw error;
        }

        return {
            email: data.email,
            accepted_at: new Date(data.accepted_at)
        };
    } catch (error) {
        console.error('Error creating terms acceptance:', error);
        throw error;
    }
}

// Find terms acceptance by email
export async function findTermsAcceptanceByEmail(email: string): Promise<UserTermsAcceptance | null> {
    try {
        const { data, error } = await supabase
            .from('UserTermsAcceptance')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows returned
                return null;
            }
            throw error;
        }

        return {
            email: data.email,
            accepted_at: new Date(data.accepted_at)
        };
    } catch (error) {
        console.error('Error finding terms acceptance:', error);
        throw new Error('Failed to find terms acceptance');
    }
}

// Check if user has accepted terms
export async function hasAcceptedTerms(email: string): Promise<boolean> {
    try {
        const acceptance = await findTermsAcceptanceByEmail(email);
        return acceptance !== null;
    } catch (error) {
        console.error('Error checking terms acceptance:', error);
        return false;
    }
}

// Update terms acceptance timestamp
export async function updateTermsAcceptance(email: string): Promise<UserTermsAcceptance> {
    try {
        const { data, error } = await supabase
            .from('UserTermsAcceptance')
            .update({ accepted_at: new Date().toISOString() })
            .eq('email', email.toLowerCase())
            .select('*')
            .single();

        if (error) throw error;

        return {
            email: data.email,
            accepted_at: new Date(data.accepted_at)
        };
    } catch (error) {
        console.error('Error updating terms acceptance:', error);
        throw new Error('Failed to update terms acceptance');
    }
}

// Delete terms acceptance record
export async function deleteTermsAcceptance(email: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('UserTermsAcceptance')
            .delete()
            .eq('email', email.toLowerCase());

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting terms acceptance:', error);
        throw new Error('Failed to delete terms acceptance');
    }
}

// Get all terms acceptances (admin function)
export async function getAllTermsAcceptances(): Promise<UserTermsAcceptance[]> {
    try {
        const { data, error } = await supabase
            .from('UserTermsAcceptance')
            .select('*')
            .order('accepted_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            email: item.email,
            accepted_at: new Date(item.accepted_at)
        }));
    } catch (error) {
        console.error('Error getting all terms acceptances:', error);
        throw new Error('Failed to get terms acceptances');
    }
}

// Get terms acceptances after a specific date
export async function getTermsAcceptancesAfter(date: Date): Promise<UserTermsAcceptance[]> {
    try {
        const { data, error } = await supabase
            .from('UserTermsAcceptance')
            .select('*')
            .gt('accepted_at', date.toISOString())
            .order('accepted_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            email: item.email,
            accepted_at: new Date(item.accepted_at)
        }));
    } catch (error) {
        console.error('Error getting terms acceptances after date:', error);
        throw new Error('Failed to get terms acceptances');
    }
}

// Get count of total terms acceptances
export async function getTermsAcceptanceCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('UserTermsAcceptance')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error('Error getting terms acceptance count:', error);
        throw new Error('Failed to get terms acceptance count');
    }
}