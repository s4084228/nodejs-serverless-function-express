// api/subscription/Create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { createNewSubscription } from '../../services/SubscriptionService';

const createSubscription = async (req: VercelRequest, res: VercelResponse) => {
    const {
        subscriptionId,  // Add this line
        email,
        planId,
        status,
        startDate,
        renewalDate,
        expiresAt,
        autoRenew
    } = req.body;

    try {
        const subscription = await createNewSubscription({
            subscriptionId,  
            email,
            planId,
            status,
            startDate,
            renewalDate,
            expiresAt,
            autoRenew
        });

        ResponseUtils.send(res, ResponseUtils.created(subscription, 'Subscription created successfully'));
    } catch (error: any) {
        if (error.message === 'PLAN_NOT_FOUND') {
            ResponseUtils.send(res, ResponseUtils.notFound('Plan not found'));
            return;
        }
        throw error;
    }
};

export default createHandler(createSubscription, {
    allowedMethods: ['POST'],
    requireAuth: true
});