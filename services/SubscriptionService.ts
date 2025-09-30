// services/SubscriptionService.ts - Business logic for subscription management

import {
    createSubscription,
    findSubscriptionById,
    findSubscriptionsByEmail,
    findActiveSubscriptionByEmail,
    updateSubscription
} from './utils/supabaseUtils/SubscriptionUtils';

import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/Subscription';
import { SubscriptionData } from './entities/subscription/SubscriptionData';

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

export async function getUserSubscription(email: string): Promise<SubscriptionData> {
    try {
        const subscriptions = await findSubscriptionsByEmail(email.toLowerCase());

        // Check if user has any subscriptions
        if (!subscriptions || subscriptions.length === 0) {
            // Return free plan with null data if no subscription exists
            return {
                subscriptionId: "",
                email: email.toLowerCase(),
                planId: 'free',
                status: 'active',
                startDate: "",
                renewalDate: null,
                expiresAt: null,
                autoRenew: false,
                updatedAt: ""
            };
        }

        // Try to find an active subscription first
        const activeSubscription = subscriptions.find(sub => sub.status === 'active');

        // Use active subscription if found, otherwise use the most recent one
        const subscription = activeSubscription || subscriptions.sort((a, b) =>
            new Date(b.updated_at || b.start_date).getTime() -
            new Date(a.updated_at || a.start_date).getTime()
        )[0];

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
        console.error('Error getting user subscription:', error);
        throw error;

        // Return free plan on error
        //return {
        //    subscriptionId: "",
        //    email: email.toLowerCase(),
        //    planId: 'free',
        //    status: '',
        //    startDate: "",
        //    renewalDate: null,
        //    expiresAt: null,
        //    autoRenew: false,
        //    updatedAt: ""
        //};
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

