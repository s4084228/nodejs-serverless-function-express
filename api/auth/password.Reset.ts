import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { PasswordResetService } from '../../services/PasswordResetService';
import { PasswordResetRequest } from '../../services/entities/auth/PasswordResetRequest';


const resetPassword = async (req: VercelRequest, res: VercelResponse) => {
    try {
        console.log("req.body: ", req.body);
        
        // This check should be redundant since validator runs first
        if (!req.body) {
            ResponseUtils.send(res, ResponseUtils.error('Request body is required', 400));
            return;
        }

        const { email, action, token, newPassword }: PasswordResetRequest = req.body;
        
        if (action === 'request-reset') {
            const result = await PasswordResetService.requestPasswordReset(email);
            ResponseUtils.send(res, result.success 
                ? ResponseUtils.success({}, result.message, result.statusCode)
                : ResponseUtils.error(result.message, result.statusCode)
            );
            return;
        }
        
        if (action === 'verify-token') {
            if (!token || !newPassword) {
                ResponseUtils.send(res, ResponseUtils.error('Token and new password are required', 400));
                return;
            }
            
            const result = await PasswordResetService.verifyTokenAndResetPassword(email, token, newPassword);
            ResponseUtils.send(res, result.success 
                ? ResponseUtils.success({}, result.message, result.statusCode)
                : ResponseUtils.error(result.message, result.statusCode)
            );
            return;
        }
        
        ResponseUtils.send(res, ResponseUtils.error('Invalid action', 400));
    } catch (error) {
        console.error('Password reset handler error:', error);
        ResponseUtils.send(res, ResponseUtils.error('Internal server error', 500));
    }
};

export default createHandler(resetPassword, {
    allowedMethods: ['POST'],
    validator: Validators.passwordReset
});