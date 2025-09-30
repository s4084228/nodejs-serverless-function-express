// services/SubscriptionService.ts - Business logic for subscription management

import {
    //createPlan,
    //findPlanById,
    //findPlanByName,
    //getAllPlans,
    //updatePlan,
    //deletePlan,
    createSubscription,
    findSubscriptionById,
    findSubscriptionsByEmail,
    findActiveSubscriptionByEmail,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
    createInvoice,
    findInvoiceById,
    findInvoicesByEmail,
    findInvoicesBySubscription,
    updateInvoice,
    deleteInvoice
} from './utils/supabaseUtils/SubscriptionUtils';


import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/Subscription';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/Invoice';
import { SubscriptionData } from './entities/subscription/SubscriptionData';
import { InvoiceData } from './entities/subscription/InvoiceData';

// Plan Services

// Subscription Services
export async function createNewSubscription(subscriptionData: {
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
        const dto: CreateSubscriptionDto = {
            subscription_ID: subscriptionData.subscriptionId,
            email: subscriptionData.email.toLowerCase(),
            plan_ID: subscriptionData.planId,
            status: subscriptionData.status || 'active',
            start_date: subscriptionData.startDate || new Date().toISOString(),
            renewal_date: subscriptionData.renewalDate || null,
            expires_at: subscriptionData.expiresAt || null,
            auto_renew: subscriptionData.autoRenew ?? true
        };

        const subscription = await createSubscription(dto);
        const subscription2 = await findSubscriptionById(subscription.subscription_ID);

        if (!subscription2) {
            throw new Error('Failed to retrieve created subscription');
        }

        return {
            subscriptionId: subscription2.subscription_ID,
            email: subscription2.email,
            planId: subscription2.plan_ID,
            status: subscription2.status,
            startDate: subscription2.start_date,
            renewalDate: subscription2.renewal_date,
            expiresAt: subscription2.expires_at,
            autoRenew: subscription2.auto_renew,
            updatedAt: subscription2.updated_at
        };
    } catch (error) {
        console.error('Error creating subscription:', error);
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
            //planName: subscription.plan.name,
           // planPrice: subscription.plan.price_cents,
            //billingInterval: subscription.plan.billing_interval,
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
            //planName: sub.plan.name,
            //planPrice: sub.plan.price_cents,
            //billingInterval: sub.plan.billing_interval,
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
            //planName: subscription.plan.name,
            //planPrice: subscription.plan.price_cents,
            //billingInterval: subscription.plan.billing_interval,
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

export async function updateExistingSubscription(
    subscriptionId: string,
    updates: {
        status?: 'active' | 'cancelled' | 'expired' | 'pending';
        planId?: string;
        renewalDate?: string;
        expiresAt?: string;
        autoRenew?: boolean;
    }
): Promise<SubscriptionData> {
    try {
        const dto: UpdateSubscriptionDto = {};
        if (updates.status !== undefined) dto.status = updates.status;
        if (updates.planId !== undefined) dto.plan_ID = updates.planId;
        if (updates.renewalDate !== undefined) dto.renewal_date = updates.renewalDate;
        if (updates.expiresAt !== undefined) dto.expires_at = updates.expiresAt;
        if (updates.autoRenew !== undefined) dto.auto_renew = updates.autoRenew;

        await updateSubscription(subscriptionId, dto);
        const subscription = await findSubscriptionById(subscriptionId);

        if (!subscription) {
            throw new Error('Failed to retrieve updated subscription');
        }

        return {
            subscriptionId: subscription.subscription_ID,
            email: subscription.email,
            planId: subscription.plan_ID,
            //planName: subscription.plan.name,
            //planPrice: subscription.plan.price_cents,
            //billingInterval: subscription.plan.billing_interval,
            status: subscription.status,
            startDate: subscription.start_date,
            renewalDate: subscription.renewal_date,
            expiresAt: subscription.expires_at,
            autoRenew: subscription.auto_renew,
            updatedAt: subscription.updated_at
        };
    } catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}

export async function cancelUserSubscription(subscriptionId: string): Promise<SubscriptionData> {
    try {
        await cancelSubscription(subscriptionId);
        const subscription = await findSubscriptionById(subscriptionId);

        if (!subscription) {
            throw new Error('Failed to retrieve cancelled subscription');
        }

        return {
            subscriptionId: subscription.subscription_ID,
            email: subscription.email,
            planId: subscription.plan_ID,
            //planName: subscription.plan.name,
            //planPrice: subscription.plan.price_cents,
            //billingInterval: subscription.plan.billing_interval,
            status: subscription.status,
            startDate: subscription.start_date,
            renewalDate: subscription.renewal_date,
            expiresAt: subscription.expires_at,
            autoRenew: subscription.auto_renew,
            updatedAt: subscription.updated_at
        };
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
    }
}

export async function removeSubscription(subscriptionId: string): Promise<void> {
    try {
        await deleteSubscription(subscriptionId);
    } catch (error) {
        console.error('Error deleting subscription:', error);
        throw error;
    }
}

// Invoice Services
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
}

export async function updateExistingInvoice(
    invoiceId: number,
    updates: {
        status?: 'paid' | 'pending' | 'overdue' | 'cancelled';
        pdfUrl?: string;
        isPublic?: boolean;
    }
): Promise<InvoiceData> {
    try {
        const dto: UpdateInvoiceDto = {};
        if (updates.status !== undefined) dto.status = updates.status;
        if (updates.pdfUrl !== undefined) dto.pdf_url = updates.pdfUrl;
        if (updates.isPublic !== undefined) dto.is_public = updates.isPublic;

        await updateInvoice(invoiceId, dto);
        const invoice = await findInvoiceById(invoiceId);

        if (!invoice) {
            throw new Error('Failed to retrieve updated invoice');
        }

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
        console.error('Error updating invoice:', error);
        throw error;
    }
}

export async function removeInvoice(invoiceId: number): Promise<void> {
    try {
        await deleteInvoice(invoiceId);
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
}