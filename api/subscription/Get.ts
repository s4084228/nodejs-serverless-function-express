// api/subscription/Get.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { getSubscriptionById } from '../../services/SubscriptionService';

const getSubscription = async (req: VercelRequest, res: VercelResponse) => {
    const { subscriptionId } = req.query;

    const subscription = await getSubscriptionById(subscriptionId as string);

    if (!subscription) {
        ResponseUtils.send(res, ResponseUtils.notFound('Subscription not found'));
        return;
    }

    ResponseUtils.send(res, ResponseUtils.success(subscription, 'Subscription retrieved successfully'));
};

export default createHandler(getSubscription, {
    allowedMethods: ['GET'],
    requireAuth: true
});