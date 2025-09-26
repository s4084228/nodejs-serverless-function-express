import { UserNewsLetterSubs } from '../../dto/UserNewsLetterSubs';
import { createClient } from '@supabase/supabase-js';



const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);



// Create newsletter subscription record
export async function createNewsletterSubscription(email: string): Promise<UserNewsLetterSubs> {
    try {
        const subscriptionData = {
            email: email.toLowerCase(),
            accepted_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
            .insert(subscriptionData)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new Error('NEWSLETTER_ALREADY_SUBSCRIBED');
            }
            throw error;
        }

        return {
            email: data.email,
            accepted_at: new Date(data.accepted_at)
        };
    } catch (error) {
        console.error('Error creating newsletter subscription:', error);
        throw error;
    }
}

// Find newsletter subscription by email
export async function findNewsletterSubscriptionByEmail(email: string): Promise<UserNewsLetterSubs | null> {
    try {
        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
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
        console.error('Error finding newsletter subscription:', error);
        throw new Error('Failed to find newsletter subscription');
    }
}

// Check if user is subscribed to newsletter
export async function isSubscribedToNewsletter(email: string): Promise<boolean> {
    try {
        const subscription = await findNewsletterSubscriptionByEmail(email);
        return subscription !== null;
    } catch (error) {
        console.error('Error checking newsletter subscription:', error);
        return false;
    }
}

// Update newsletter subscription timestamp (resubscribe)
export async function updateNewsletterSubscription(email: string): Promise<UserNewsLetterSubs> {
    try {
        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
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
        console.error('Error updating newsletter subscription:', error);
        throw new Error('Failed to update newsletter subscription');
    }
}

// Unsubscribe from newsletter (delete record)
export async function unsubscribeFromNewsletter(email: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('UserNewsLetterSubs')
            .delete()
            .eq('email', email.toLowerCase());

        if (error) throw error;
    } catch (error) {
        console.error('Error unsubscribing from newsletter:', error);
        throw new Error('Failed to unsubscribe from newsletter');
    }
}

// Get all newsletter subscriptions (admin function)
export async function getAllNewsletterSubscriptions(): Promise<UserNewsLetterSubs[]> {
    try {
        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
            .select('*')
            .order('accepted_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            email: item.email,
            accepted_at: new Date(item.accepted_at)
        }));
    } catch (error) {
        console.error('Error getting all newsletter subscriptions:', error);
        throw new Error('Failed to get newsletter subscriptions');
    }
}

// Get newsletter subscriptions after a specific date
export async function getNewsletterSubscriptionsAfter(date: Date): Promise<UserNewsLetterSubs[]> {
    try {
        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
            .select('*')
            .gt('accepted_at', date.toISOString())
            .order('accepted_at', { ascending: false });

        if (error) throw error;

        return data.map(item => ({
            email: item.email,
            accepted_at: new Date(item.accepted_at)
        }));
    } catch (error) {
        console.error('Error getting newsletter subscriptions after date:', error);
        throw new Error('Failed to get newsletter subscriptions');
    }
}

// Get count of total newsletter subscriptions
export async function getNewsletterSubscriptionCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('UserNewsLetterSubs')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error('Error getting newsletter subscription count:', error);
        throw new Error('Failed to get newsletter subscription count');
    }
}

// Bulk subscribe emails to newsletter (admin function)
export async function bulkSubscribeToNewsletter(emails: string[]): Promise<UserNewsLetterSubs[]> {
    try {
        const subscriptionData = emails.map(email => ({
            email: email.toLowerCase(),
            accepted_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
            .insert(subscriptionData)
            .select('*');

        if (error) throw error;

        return data.map(item => ({
            email: item.email,
            accepted_at: new Date(item.accepted_at)
        }));
    } catch (error) {
        console.error('Error bulk subscribing to newsletter:', error);
        throw new Error('Failed to bulk subscribe to newsletter');
    }
}

// Export list of newsletter subscribers (admin function)
export async function exportNewsletterSubscribers(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('UserNewsLetterSubs')
            .select('email')
            .order('email', { ascending: true });

        if (error) throw error;

        return data.map(item => item.email);
    } catch (error) {
        console.error('Error exporting newsletter subscribers:', error);
        throw new Error('Failed to export newsletter subscribers');
    }
}