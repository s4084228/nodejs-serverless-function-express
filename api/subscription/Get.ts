// api/subscription/Get.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import {
    getSubscriptionById,
    getActiveUserSubscription,
    getUserSubscription
} from '../../services/SubscriptionService';
import { AuthenticatedRequest } from '../../services/middleware/Auth';

const getSubscription = async (req: VercelRequest, res: VercelResponse) => {
    // Cast to AuthenticatedRequest since requireAuth: true ensures user exists
    const authenticatedReq = req as AuthenticatedRequest;
    const { subscriptionId } = req.query;

    try {
        let subscription;

        if (subscriptionId) {
            // If subscriptionId is provided in query params, get by ID
            subscription = await getSubscriptionById(subscriptionId as string);

            if (!subscription) {
                ResponseUtils.send(res, ResponseUtils.notFound('Subscription not found'));
                return;
            }

            // Verify that the subscription belongs to the authenticated user
            if (subscription.email.toLowerCase() !== authenticatedReq.user.email.toLowerCase()) {
                ResponseUtils.send(res, ResponseUtils.forbidden('You do not have access to this subscription'));
                return;
            }
        } else {
            // If no subscriptionId, get active subscription by email from JWT
            const userEmail = authenticatedReq.user.email;
            //subscription = await getActiveUserSubscription(userEmail);
            subscription = await getUserSubscription(userEmail);
            

            //if (!subscription) {
            //    ResponseUtils.send(res, ResponseUtils.notFound('No active subscription found for this user'));
            //    return;
            //}
        }

        ResponseUtils.send(res, ResponseUtils.success(subscription, 'Subscription retrieved successfully'));
    } catch (error) {
        console.error('Error retrieving subscription:', error);
        ResponseUtils.send(res, ResponseUtils.serverError('Failed to retrieve subscription'));
    }
};

export default createHandler(getSubscription, {
    allowedMethods: ['GET'],
    requireAuth: true
});