// services/SubscriptionService.ts - Business logic for subscription management

import {
    createSubscription,
    findSubscriptionById,
    findSubscriptionsByEmail,
    findActiveSubscriptionByEmail,
    updateSubscription
} from './utils/supabaseUtils/SubscriptionUtils';

import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/Subscription';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/Invoice';
import { SubscriptionData } from './entities/subscription/SubscriptionData';
import { InvoiceData } from './entities/subscription/InvoiceData';

// Subscription Services

/**
 * Create or Update Subscription
 * - If email already has an active subscription, update it
 * - Otherwise, create a new subscription
 */
export async function createOrUpdateSubscription(subscriptionData: {
    subscriptionId: string;
    email: string;
    planId: string;
    status?: 'active' | 'cancelled' | 'expired' | 'pending';
    startDate?: string;
    renewalDate?: string;
    expiresAt?: string;
    autoRenew?: boolean;
}): Promise<SubscriptionData> {
    try {
        const normalizedEmail = subscriptionData.email.toLowerCase();

        // Check if user already has a subscription
        const existingSubscription = await findActiveSubscriptionByEmail(normalizedEmail);

        if (existingSubscription) {
            // UPDATE existing subscription
            console.log(`Updating existing subscription for email: ${normalizedEmail}`);

            const updateDto: UpdateSubscriptionDto = {
                subscription_ID: subscriptionData.subscriptionId,
                plan_ID: subscriptionData.planId,
                status: subscriptionData.status || 'active',
                renewal_date: subscriptionData.renewalDate || null,
                expires_at: subscriptionData.expiresAt || null,
                auto_renew: subscriptionData.autoRenew ?? true
            };

            await updateSubscription(existingSubscription.subscription_ID, updateDto);

            // Fetch updated subscription
            const updatedSubscription = await findSubscriptionById(existingSubscription.subscription_ID);

            if (!updatedSubscription) {
                throw new Error('Failed to retrieve updated subscription');
            }

            return {
                subscriptionId: updatedSubscription.subscription_ID,
                email: updatedSubscription.email,
                planId: updatedSubscription.plan_ID,
                status: updatedSubscription.status,
                startDate: updatedSubscription.start_date,
                renewalDate: updatedSubscription.renewal_date,
                expiresAt: updatedSubscription.expires_at,
                autoRenew: updatedSubscription.auto_renew,
                updatedAt: updatedSubscription.updated_at
            };
        } else {
            // CREATE new subscription
            console.log(`Creating new subscription for email: ${normalizedEmail}`);

            const createDto: CreateSubscriptionDto = {
                subscription_ID: subscriptionData.subscriptionId,
                email: normalizedEmail,
                plan_ID: subscriptionData.planId,
                status: subscriptionData.status || 'active',
                start_date: subscriptionData.startDate || new Date().toISOString(),
                renewal_date: subscriptionData.renewalDate || null,
                expires_at: subscriptionData.expiresAt || null,
                auto_renew: subscriptionData.autoRenew ?? true
            };

            const newSubscription = await createSubscription(createDto);
            const subscription = await findSubscriptionById(newSubscription.subscription_ID);

            if (!subscription) {
                throw new Error('Failed to retrieve created subscription');
            }

            return {
                subscriptionId: subscription.subscription_ID,
                email: subscription.email,
                planId: subscription.plan_ID,
                status: subscription.status,
                startDate: subscription.start_date,
                renewalDate: subscription.renewal_date,
                expiresAt: subscription.expires_at,
                autoRenew: subscription.auto_renew,
                updatedAt: subscription.updated_at
            };
        }
    } catch (error) {
        console.error('Error creating/updating subscription:', error);
        throw error;
    }
}

export async function getSubscriptionById(subscriptionId: string): Promise<SubscriptionData | null> {
    try {
        const subscription = await findSubscriptionById(subscriptionId);
        if (!subscription) return null;

        return {
            subscriptionId: subscription.subscription_ID,
            email: subscription.email,
            planId: subscription.plan_ID,
            status: subscription.status,
            startDate: subscription.start_date,
            renewalDate: subscription.renewal_date,
            expiresAt: subscription.expires_at,
            autoRenew: subscription.auto_renew,
            updatedAt: subscription.updated_at
        };
    } catch (error) {
        console.error('Error getting subscription:', error);
        throw error;
    }
}

export async function getUserSubscriptions(email: string): Promise<SubscriptionData[]> {
    try {
        const subscriptions = await findSubscriptionsByEmail(email.toLowerCase());

        return subscriptions.map(sub => ({
            subscriptionId: sub.subscription_ID,
            email: sub.email,
            planId: sub.plan_ID,
            status: sub.status,
            startDate: sub.start_date,
            renewalDate: sub.renewal_date,
            expiresAt: sub.expires_at,
            autoRenew: sub.auto_renew,
            updatedAt: sub.updated_at
        }));
    } catch (error) {
        console.error('Error getting user subscriptions:', error);
        throw error;
    }
}

export async function getActiveUserSubscription(email: string): Promise<SubscriptionData | null> {
    try {
        const subscription = await findActiveSubscriptionByEmail(email.toLowerCase());
        if (!subscription) return null;

        return {
            subscriptionId: subscription.subscription_ID,
            email: subscription.email,
            planId: subscription.plan_ID,
            status: subscription.status,
            startDate: subscription.start_date,
            renewalDate: subscription.renewal_date,
            expiresAt: subscription.expires_at,
            autoRenew: subscription.auto_renew,
            updatedAt: subscription.updated_at
        };
    } catch (error) {
        console.error('Error getting active subscription:', error);
        throw error;
    }
}

// Invoice Services
/*
export async function createNewInvoice(invoiceData: {
    subscriptionId: string;
    email: string;
    amountCents: number;
    currency: string;
    periodStart?: string;
    periodEnd?: string;
    dueAt?: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    pdfUrl?: string;
    isPublic?: boolean;
}): Promise<InvoiceData> {
    try {
        const dto: CreateInvoiceDto = {
            subscription_ID: invoiceData.subscriptionId,
            email: invoiceData.email.toLowerCase(),
            amount_cents: invoiceData.amountCents,
            currency: invoiceData.currency,
            period_start: invoiceData.periodStart || null,
            period_end: invoiceData.periodEnd || null,
            issued_at: new Date().toISOString(),
            due_at: invoiceData.dueAt || null,
            status: invoiceData.status,
            pdf_url: invoiceData.pdfUrl || null,
            is_public: invoiceData.isPublic ?? false
        };

        const invoice = await createInvoice(dto);
        const invoiceWithDetails = await findInvoiceById(invoice.invoice_ID);

        if (!invoiceWithDetails) {
            throw new Error('Failed to retrieve created invoice');
        }

        return {
            invoiceId: invoiceWithDetails.invoice_ID,
            subscriptionId: invoiceWithDetails.subscription_ID,
            email: invoiceWithDetails.email,
            amount: invoiceWithDetails.amount_cents / 100,
            amountCents: invoiceWithDetails.amount_cents,
            currency: invoiceWithDetails.currency,
            periodStart: invoiceWithDetails.period_start,
            periodEnd: invoiceWithDetails.period_end,
            issuedAt: invoiceWithDetails.issued_at,
            dueAt: invoiceWithDetails.due_at,
            status: invoiceWithDetails.status,
            pdfUrl: invoiceWithDetails.pdf_url,
            isPublic: invoiceWithDetails.is_public,
            planName: invoiceWithDetails.subscription.plan.name,
            planPrice: invoiceWithDetails.subscription.plan.price_cents
        };
    } catch (error) {
        console.error('Error creating invoice:', error);
        throw error;
    }
}

export async function getInvoiceById(invoiceId: number): Promise<InvoiceData | null> {
    try {
        const invoice = await findInvoiceById(invoiceId);
        if (!invoice) return null;

        return {
            invoiceId: invoice.invoice_ID,
            subscriptionId: invoice.subscription_ID,
            email: invoice.email,
            amount: invoice.amount_cents / 100,
            amountCents: invoice.amount_cents,
            currency: invoice.currency,
            periodStart: invoice.period_start,
            periodEnd: invoice.period_end,
            issuedAt: invoice.issued_at,
            dueAt: invoice.due_at,
            status: invoice.status,
            pdfUrl: invoice.pdf_url,
            isPublic: invoice.is_public,
            planName: invoice.subscription.plan.name,
            planPrice: invoice.subscription.plan.price_cents
        };
    } catch (error) {
        console.error('Error getting invoice:', error);
        throw error;
    }
}

export async function getUserInvoices(email: string): Promise<InvoiceData[]> {
    try {
        const invoices = await findInvoicesByEmail(email.toLowerCase());

        return invoices.map(inv => ({
            invoiceId: inv.invoice_ID,
            subscriptionId: inv.subscription_ID,
            email: inv.email,
            amount: inv.amount_cents / 100,
            amountCents: inv.amount_cents,
            currency: inv.currency,
            periodStart: inv.period_start,
            periodEnd: inv.period_end,
            issuedAt: inv.issued_at,
            dueAt: inv.due_at,
            status: inv.status,
            pdfUrl: inv.pdf_url,
            isPublic: inv.is_public,
            planName: inv.subscription.plan.name,
            planPrice: inv.subscription.plan.price_cents
        }));
    } catch (error) {
        console.error('Error getting user invoices:', error);
        throw error;
    }
}

export async function getSubscriptionInvoices(subscriptionId: string): Promise<InvoiceData[]> {
    try {
        const invoices = await findInvoicesBySubscription(subscriptionId);

        return invoices.map(inv => ({
            invoiceId: inv.invoice_ID,
            subscriptionId: inv.subscription_ID,
            email: inv.email,
            amount: inv.amount_cents / 100,
            amountCents: inv.amount_cents,
            currency: inv.currency,
            periodStart: inv.period_start,
            periodEnd: inv.period_end,
            issuedAt: inv.issued_at,
            dueAt: inv.due_at,
            status: inv.status,
            pdfUrl: inv.pdf_url,
            isPublic: inv.is_public
        }));
    } catch (error) {
        console.error('Error getting subscription invoices:', error);
        throw error;
    }
}*/