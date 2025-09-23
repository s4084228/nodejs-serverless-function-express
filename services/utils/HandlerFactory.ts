// services/utils/HandlerFactory.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CorsUtils } from './CorsUtils';
import { ResponseUtils } from './ResponseUtils';
import { validateToken, AuthenticatedRequest } from '../middleware/Auth';

interface HandlerOptions {
  requireAuth?: boolean;
  allowedMethods?: string[];
  validator?: (data: any) => string[];
}

type HandlerFunction<T = VercelRequest> = (req: T, res: VercelResponse) => Promise<void>;

export const createHandler = (
  handler: HandlerFunction<any>,
  options: HandlerOptions = {}
) => {
  const { requireAuth = false, allowedMethods = [], validator } = options;

  const wrappedHandler = async (req: VercelRequest, res: VercelResponse) => {
    try {
      // 1. CORS (always first)
      CorsUtils.setCors(res);
      if (CorsUtils.handleOptions(req, res)) return;

      // 2. Method validation
      if (allowedMethods.length > 0 && !allowedMethods.includes(req.method!)) {
        return ResponseUtils.send(res, ResponseUtils.error('Method not allowed', 405));
      }

      // 3. Validation (if provided)
      if (validator && req.body) {
        const errors = validator(req.body);
        if (errors.length > 0) {
          return ResponseUtils.send(res, ResponseUtils.error('Validation failed', 400, errors));
        }
      }

      // 4. Execute handler
      await handler(req, res);

    } catch (error) {
      console.error('Handler error:', error);
      return ResponseUtils.send(res, ResponseUtils.handleServiceError(error));
    }
  };

  // 5. Apply auth wrapper if needed
  return requireAuth ? validateToken(wrappedHandler) : wrappedHandler;
};