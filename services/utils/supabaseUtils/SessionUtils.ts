// services/utils/SessionUtils.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);

// Create a new session when user logs in
export async function createUserSession(userId: number) {
    try {
        const { data, error } = await supabase
            .from('UserSession')
            .insert({
                user_id: userId,
                login_at: new Date().toISOString(),
                logout_at: null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating user session:', error);
        throw new Error('Failed to create session');
    }
}

// Update session when user logs out
export async function closeUserSession(userId: number) {
    try {
        // Find the most recent active session for this user
        const { data: sessions, error: findError } = await supabase
            .from('UserSession')
            .select('session_id')
            .eq('user_id', userId)
            .is('logout_at', null)
            .order('login_at', { ascending: false })
            .limit(1);

        if (findError) throw findError;

        if (sessions && sessions.length > 0) {
            const { error: updateError } = await supabase
                .from('UserSession')
                .update({ logout_at: new Date().toISOString() })
                .eq('session_id', sessions[0].session_id);

            if (updateError) throw updateError;
        }
    } catch (error) {
        console.error('Error closing user session:', error);
        throw new Error('Failed to close session');
    }
}

// Get active sessions count
export async function getActiveSessionsCount(): Promise<number> {
    try {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const { data, error } = await supabase
            .from('UserSession')
            .select('user_id', { count: 'exact', head: true })
            .is('logout_at', null)
            .gte('login_at', thirtyMinutesAgo.toISOString());

        if (error) throw error;
        return data?.length || 0;
    } catch (error) {
        console.error('Error getting active sessions:', error);
        return 0;
    }
}

// Get daily active users
export async function getDailyActiveUsers(): Promise<number> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('UserSession')
            .select('user_id')
            .gte('login_at', today.toISOString());

        if (error) throw error;

        // Count unique users
        const uniqueUsers = new Set(data?.map(s => s.user_id) || []);
        return uniqueUsers.size;
    } catch (error) {
        console.error('Error getting daily active users:', error);
        return 0;
    }
}