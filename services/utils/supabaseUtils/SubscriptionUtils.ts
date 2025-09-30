// services/utils/SubscriptionUtils.ts

import { createClient } from '@supabase/supabase-js';
import {
    Subscription,
    CreateSubscriptionDto,
    UpdateSubscriptionDto
} from '../../dto/Subscription';
import {
    Invoice,
    CreateInvoiceDto,
    UpdateInvoiceDto
} from '../../dto/Invoice';

const supabase = createClient(
    process.env.TOC_SUPABASE_URL!,
    process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!
);

// Subscription operations
export async function createSubscription(subscriptionData: CreateSubscriptionDto): Promise<Subscription> {
    try {
        const { data, error } = await supabase
            .from('Subscription')
            .insert({
                subscription_ID: subscriptionData.subscription_ID,
                email: subscriptionData.email,
                plan_ID: subscriptionData.plan_ID,
                status: subscriptionData.status,
                start_date: subscriptionData.start_date || new Date().toISOString(),
                renewal_date: subscriptionData.renewal_date,
                expires_at: subscriptionData.expires_at,
                auto_renew: subscriptionData.auto_renew ?? true,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            // Preserve the original error with all its details
            console.error('Supabase error creating subscription:', error);

            // Create a more detailed error object that includes Supabase error info
            const detailedError: any = new Error(error.message || 'Failed to create subscription');
            detailedError.code = error.code;
            detailedError.details = error.details;
            detailedError.hint = error.hint;

            throw detailedError;
        }

        return data;
    } catch (error) {
        // Re-throw the error without modifying it
        throw error;
    }
}

export async function findSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    try {
        const { data, error } = await supabase
            .from('Subscription')
            .select('*')
            .eq('subscription_ID', subscriptionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding subscription:', error);
        throw new Error('Failed to find subscription');
    }
}

export async function findSubscriptionsByEmail(email: string): Promise<Subscription[]> {
    try {
        const { data, error } = await supabase
            .from('Subscription')
            .select('*')
            .eq('email', email)
            .order('start_date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error finding subscriptions by email:', error);
        throw new Error('Failed to find subscriptions');
    }
}

export async function findActiveSubscriptionByEmail(email: string): Promise<Subscription | null> {
    try {
        const { data, error } = await supabase
            .from('Subscription')
            .select('*')
            .eq('email', email)
            .eq('status', 'active')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding active subscription:', error);
        throw new Error('Failed to find active subscription');
    }
}

export async function updateSubscription(
    subscriptionId: string,
    updates: UpdateSubscriptionDto
): Promise<Subscription> {
    try {
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.subscription_ID !== undefined) updateData.subscription_ID = updates.subscription_ID;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.plan_ID !== undefined) updateData.plan_ID = updates.plan_ID;
        if (updates.renewal_date !== undefined) updateData.renewal_date = updates.renewal_date;
        if (updates.expires_at !== undefined) updateData.expires_at = updates.expires_at;
        if (updates.auto_renew !== undefined) updateData.auto_renew = updates.auto_renew;

        const { data, error } = await supabase
            .from('Subscription')
            .update(updateData)
            .eq('subscription_ID', subscriptionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw new Error('Failed to update subscription');
    }
}

export async function cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
        const { data, error } = await supabase
            .from('Subscription')
            .update({
                status: 'cancelled',
                auto_renew: false,
                updated_at: new Date().toISOString()
            })
            .eq('subscription_ID', subscriptionId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw new Error('Failed to cancel subscription');
    }
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('Subscription')
            .delete()
            .eq('subscription_ID', subscriptionId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw new Error('Failed to delete subscription');
    }
}

// Invoice operations
export async function createInvoice(invoiceData: CreateInvoiceDto): Promise<Invoice> {
    try {
        const { data, error } = await supabase
            .from('Invoice')
            .insert({
                subscription_ID: invoiceData.subscription_ID,
                email: invoiceData.email,
                amount_cents: invoiceData.amount_cents,
                currency: invoiceData.currency,
                period_start: invoiceData.period_start,
                period_end: invoiceData.period_end,
                issued_at: invoiceData.issued_at || new Date().toISOString(),
                due_at: invoiceData.due_at,
                status: invoiceData.status,
                pdf_url: invoiceData.pdf_url,
                is_public: invoiceData.is_public ?? false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw new Error('Failed to create invoice');
    }
}

export async function findInvoiceById(invoiceId: number): Promise<Invoice | null> {
    try {
        const { data, error } = await supabase
            .from('Invoice')
            .select('*')
            .eq('invoice_ID', invoiceId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error finding invoice:', error);
        throw new Error('Failed to find invoice');
    }
}

export async function findInvoicesByEmail(email: string): Promise<Invoice[]> {
    try {
        const { data, error } = await supabase
            .from('Invoice')
            .select('*')
            .eq('email', email)
            .order('issued_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error finding invoices by email:', error);
        throw new Error('Failed to find invoices');
    }
}

export async function findInvoicesBySubscription(subscriptionId: string): Promise<Invoice[]> {
    try {
        const { data, error } = await supabase
            .from('Invoice')
            .select('*')
            .eq('subscription_ID', subscriptionId)
            .order('issued_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error finding invoices by subscription:', error);
        throw new Error('Failed to find invoices');
    }
}

export async function updateInvoice(
    invoiceId: number,
    updates: UpdateInvoiceDto
): Promise<Invoice> {
    try {
        const updateData: any = {};
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.pdf_url !== undefined) updateData.pdf_url = updates.pdf_url;
        if (updates.is_public !== undefined) updateData.is_public = updates.is_public;

        const { data, error } = await supabase
            .from('Invoice')
            .update(updateData)
            .eq('invoice_ID', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Failed to update invoice');
    }
}

export async function deleteInvoice(invoiceId: number): Promise<void> {
    try {
        const { error } = await supabase
            .from('Invoice')
            .delete()
            .eq('invoice_ID', invoiceId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw new Error('Failed to delete invoice');
    }
}