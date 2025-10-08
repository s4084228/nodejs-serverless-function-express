/**
 * CORS (Cross-Origin Resource Sharing) Utilities
 * 
 * Provides utilities for handling CORS in Vercel serverless functions.
 * CORS is a security mechanism that allows or restricts web applications
 * running on one domain to make requests to resources on another domain.
 * 
 * Key Concepts:
 * - Browsers enforce Same-Origin Policy by default (blocks cross-origin requests)
 * - CORS headers tell browsers which cross-origin requests are allowed
 * - Preflight requests (OPTIONS) check permissions before actual requests
 * 
 * Why CORS is Needed:
 * When your frontend (e.g., https://myapp.com) needs to call your API
 * (e.g., https://api.myapp.com), the browser blocks the request unless
 * the API explicitly allows it via CORS headers.
 * 
 * CORS Flow:
 * 1. Browser sends OPTIONS preflight request (for non-simple requests)
 * 2. Server responds with allowed origins, methods, and headers
 * 3. Browser sends actual request if allowed
 * 4. Server responds with data AND CORS headers
 * 
 * Security Considerations:
 * - Current implementation uses dynamic origin (reflects request origin)
 * - For production, consider whitelist of specific origins
 * - Avoid using '*' for Access-Control-Allow-Origin with credentials
 * - Validate origins against known domains
 * 
 * Usage:
 * ```typescript
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   // Always set CORS first
 *   CorsUtils.setCors(res, req);
 *   
 *   // Handle preflight
 *   if (CorsUtils.handleOptions(req, res)) return;
 *   
 *   // Your handler logic here
 * }
 * ```
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default origin fallback for local development
 * Used when no origin or referer header is present
 */
const DEFAULT_ORIGIN = 'http://localhost:3000';

/**
 * Allowed HTTP methods for CORS requests
 * These methods can be used in cross-origin requests
 */
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

/**
 * Allowed request headers for CORS requests
 * These headers can be included in cross-origin requests
 */
const ALLOWED_HEADERS = 'Content-Type, Authorization';

// ============================================================================
// CORS Utility Class
// ============================================================================

/**
 * Static utility class for CORS configuration
 * 
 * Provides methods to set CORS headers and handle preflight requests.
 * All methods are static - no instantiation needed.
 */
export class CorsUtils {

    // ========================================================================
    // CORS Configuration
    // ========================================================================

    /**
     * Sets CORS headers on the response object
     * 
     * This method configures three critical CORS headers that tell the browser
     * which cross-origin requests are permitted:
     * 
     * 1. Access-Control-Allow-Origin: Which domains can make requests
     * 2. Access-Control-Allow-Methods: Which HTTP methods are allowed
     * 3. Access-Control-Allow-Headers: Which request headers are allowed
     * 
     * Origin Determination Logic:
     * - First tries req.headers.origin (standard for fetch/XHR)
     * - Falls back to req.headers.referer (browser navigation)
     * - Final fallback to localhost:3000 (local development)
     * 
     * IMPORTANT: This must be called BEFORE sending any response,
     * including error responses. CORS headers are required on ALL responses,
     * not just successful ones.
     * 
     * Security Note:
     * Currently reflects the request origin (dynamic). In production,
     * consider implementing origin whitelisting:
     * 
     * ```typescript
     * const allowedOrigins = [
     *   'https://myapp.com',
     *   'https://staging.myapp.com',
     *   'http://localhost:3000'
     * ];
     * const origin = allowedOrigins.includes(requestOrigin) 
     *   ? requestOrigin 
     *   : allowedOrigins[0];
     * ```
     * 
     * @param res - Vercel response object to set headers on
     * @param req - Vercel request object to read origin from
     * 
     * @example
     * // Basic usage
     * CorsUtils.setCors(res, req);
     * 
     * @example
     * // Always call before any response
     * export default async function handler(req, res) {
     *   CorsUtils.setCors(res, req);  // First thing!
     *   
     *   if (!req.body.email) {
     *     return res.status(400).json({ error: 'Email required' });
     *   }
     *   // ... rest of handler
     * }
     */
    static setCors(res: VercelResponse, req: VercelRequest): void {
        /**
         * Determine the origin to allow
         * 
         * Priority order:
         * 1. origin header - Set by fetch() and XMLHttpRequest
         * 2. referer header - Set by browser for navigation requests
         * 3. localhost:3000 - Default for local development
         * 
         * The origin indicates where the request originated from.
         * For example: https://myapp.com
         */
        const origin = req.headers.origin
            || req.headers.referer
            || DEFAULT_ORIGIN;

        // Log for debugging - helps track which origins are making requests
        console.log('Setting CORS for origin:', origin);

        /**
         * Set Access-Control-Allow-Origin header
         * 
         * This tells the browser: "I allow requests from this origin"
         * 
         * Current Implementation: Reflects the request origin (dynamic)
         * - Advantage: Works with any frontend domain
         * - Disadvantage: Less secure, allows any origin
         * 
         * For production security, use origin whitelisting instead.
         */
        res.setHeader('Access-Control-Allow-Origin', origin);

        /**
         * Set Access-Control-Allow-Methods header
         * 
         * This tells the browser: "These HTTP methods are allowed"
         * 
         * Includes OPTIONS for preflight requests.
         * Browser will block any methods not listed here.
         */
        res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);

        /**
         * Set Access-Control-Allow-Headers header
         * 
         * This tells the browser: "These request headers are allowed"
         * 
         * Content-Type: Required for sending JSON data
         * Authorization: Required for JWT Bearer tokens
         * 
         * Any custom headers must be added here to be allowed.
         */
        res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

        /**
         * Optional Additional Headers (Uncomment if needed):
         * 
         * // Allow credentials (cookies, authorization headers)
         * // Note: Cannot use '*' for origin if this is enabled
         * res.setHeader('Access-Control-Allow-Credentials', 'true');
         * 
         * // Expose additional response headers to JavaScript
         * res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Number');
         * 
         * // Cache preflight response for 24 hours (reduces OPTIONS requests)
         * res.setHeader('Access-Control-Max-Age', '86400');
         */
    }

    // ========================================================================
    // Preflight Request Handling
    // ========================================================================

    /**
     * Handles CORS preflight OPTIONS requests
     * 
     * What is a Preflight Request?
     * Before sending certain requests (POST with custom headers, PUT, DELETE, etc.),
     * browsers first send an OPTIONS request to check if the actual request is allowed.
     * This is called a "preflight request."
     * 
     * Why Preflight Happens:
     * Browsers automatically send preflight for "non-simple requests":
     * - Methods other than GET, HEAD, POST
     * - POST with Content-Type other than form-data, form-urlencoded, or text/plain
     * - Requests with custom headers (like Authorization)
     * 
     * Preflight Flow:
     * 1. Browser sends OPTIONS request with:
     *    - Access-Control-Request-Method: The actual method to use
     *    - Access-Control-Request-Headers: The actual headers to send
     * 2. Server responds with CORS headers indicating what's allowed
     * 3. Browser checks if the actual request is allowed
     * 4. If allowed, browser sends the actual request
     * 
     * This Method's Role:
     * - Detects if request is an OPTIONS preflight
     * - Responds immediately with 200 OK (CORS headers already set by setCors)
     * - Returns true to signal handler to stop processing
     * - Returns false for non-OPTIONS requests (handler should continue)
     * 
     * IMPORTANT: Always call setCors() BEFORE calling this method,
     * because the OPTIONS response needs CORS headers too!
     * 
     * @param req - Vercel request object to check method
     * @param res - Vercel response object to send 200 status
     * @returns true if OPTIONS was handled, false otherwise
     * 
     * @example
     * // Typical usage in handler
     * export default async function handler(req, res) {
     *   CorsUtils.setCors(res, req);
     *   
     *   // Stop here if preflight
     *   if (CorsUtils.handleOptions(req, res)) return;
     *   
     *   // Continue with actual handler logic
     *   // ...
     * }
     * 
     * @example
     * // What browsers send for preflight
     * // OPTIONS /api/users HTTP/1.1
     * // Origin: https://myapp.com
     * // Access-Control-Request-Method: POST
     * // Access-Control-Request-Headers: content-type,authorization
     * 
     * @example
     * // What this method responds with (after setCors called)
     * // HTTP/1.1 200 OK
     * // Access-Control-Allow-Origin: https://myapp.com
     * // Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
     * // Access-Control-Allow-Headers: Content-Type, Authorization
     */
    static handleOptions(req: VercelRequest, res: VercelResponse): boolean {
        /**
         * Check if this is a preflight OPTIONS request
         * 
         * OPTIONS requests are sent by browsers automatically for CORS checks.
         * We don't need to process them - just acknowledge they're allowed.
         */
        if (req.method === 'OPTIONS') {
            console.log('Handling CORS preflight OPTIONS request');

            /**
             * Respond with 200 OK and end the request
             * 
             * The CORS headers were already set by setCors(), so we just
             * need to send a successful status and close the connection.
             * 
             * No body is needed - browser only checks headers.
             */
            res.status(200).end();

            /**
             * Return true to signal that we handled the request
             * 
             * This tells the calling handler to stop processing and return.
             * The actual handler logic should not run for OPTIONS requests.
             */
            return true;
        }

        /**
         * Not an OPTIONS request - continue normal processing
         * 
         * Return false to signal the handler should continue executing.
         */
        return false;
    }
}

// ============================================================================
// Usage Patterns and Best Practices
// ============================================================================

/*
 * PATTERN 1: Basic Handler with CORS
 * 
 * ```typescript
 * import { CorsUtils } from '@/services/utils/CorsUtils';
 * 
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   // 1. Set CORS headers (ALWAYS FIRST)
 *   CorsUtils.setCors(res, req);
 *   
 *   // 2. Handle preflight
 *   if (CorsUtils.handleOptions(req, res)) return;
 *   
 *   // 3. Your handler logic
 *   const data = await getData();
 *   res.json({ data });
 * }
 * ```
 * 
 * PATTERN 2: With HandlerFactory
 * 
 * ```typescript
 * import { createHandler } from '@/services/utils/HandlerFactory';
 * 
 * export default createHandler(async (req, res) => {
 *   // CORS is automatically handled by HandlerFactory
 *   const data = await getData();
 *   ResponseUtils.send(res, ResponseUtils.success(data));
 * });
 * ```
 * 
 * PATTERN 3: With Error Handling
 * 
 * ```typescript
 * export default async function handler(req, res) {
 *   try {
 *     // CORS must be set even before errors can occur
 *     CorsUtils.setCors(res, req);
 *     if (CorsUtils.handleOptions(req, res)) return;
 *     
 *     const data = await riskyOperation();
 *     res.json({ data });
 *   } catch (error) {
 *     // CORS headers already set, so error response will work
 *     res.status(500).json({ error: 'Internal server error' });
 *   }
 * }
 * ```
 * 
 * COMMON MISTAKES TO AVOID:
 * 
 * ❌ WRONG: Setting CORS after validation
 * ```typescript
 * if (!req.body.email) {
 *   return res.status(400).json({ error: 'Email required' });
 * }
 * CorsUtils.setCors(res, req);  // Too late! Browser already blocked
 * ```
 * 
 * ✅ CORRECT: Setting CORS first
 * ```typescript
 * CorsUtils.setCors(res, req);  // First thing!
 * if (!req.body.email) {
 *   return res.status(400).json({ error: 'Email required' });
 * }
 * ```
 * 
 * ❌ WRONG: Not handling OPTIONS
 * ```typescript
 * CorsUtils.setCors(res, req);
 * // Handler processes OPTIONS like a normal request
 * const data = await getData();  // Why is this running for OPTIONS?
 * ```
 * 
 * ✅ CORRECT: Stopping on OPTIONS
 * ```typescript
 * CorsUtils.setCors(res, req);
 * if (CorsUtils.handleOptions(req, res)) return;  // Stop here!
 * const data = await getData();  // Only runs for actual requests
 * ```
 * 
 * PRODUCTION SECURITY ENHANCEMENTS:
 * 
 * 1. Origin Whitelisting:
 * ```typescript
 * static setCors(res: VercelResponse, req: VercelRequest): void {
 *   const allowedOrigins = [
 *     'https://myapp.com',
 *     'https://www.myapp.com',
 *     'https://staging.myapp.com',
 *     process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
 *   ].filter(Boolean);
 *   
 *   const requestOrigin = req.headers.origin || DEFAULT_ORIGIN;
 *   const origin = allowedOrigins.includes(requestOrigin) 
 *     ? requestOrigin 
 *     : allowedOrigins[0];
 *   
 *   res.setHeader('Access-Control-Allow-Origin', origin);
 *   // ... rest of headers
 * }
 * ```
 * 
 * 2. Environment-based Configuration:
 * ```typescript
 * const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [DEFAULT_ORIGIN];
 * const ALLOWED_METHODS = process.env.ALLOWED_METHODS || 'GET, POST, PUT, DELETE, OPTIONS';
 * ```
 * 
 * 3. Enable Credentials (for cookies/auth):
 * ```typescript
 * res.setHeader('Access-Control-Allow-Credentials', 'true');
 * // Note: Cannot use '*' for origin when credentials are enabled
 * ```
 * 
 * 4. Cache Preflight Responses:
 * ```typescript
 * // Cache preflight for 24 hours (reduces OPTIONS requests)
 * res.setHeader('Access-Control-Max-Age', '86400');
 * ```
 * 
 * DEBUGGING CORS ISSUES:
 * 
 * 1. Check browser console for CORS errors
 * 2. Use browser DevTools Network tab to inspect headers
 * 3. Verify OPTIONS request receives correct headers
 * 4. Confirm origin matches exactly (including protocol and port)
 * 5. Check if credentials are needed but not configured
 * 6. Verify all required headers are in Access-Control-Allow-Headers
 * 
 * CORS ERROR MESSAGES AND SOLUTIONS:
 * 
 * "No 'Access-Control-Allow-Origin' header"
 * → You forgot to call setCors()
 * 
 * "Origin is not allowed by Access-Control-Allow-Origin"
 * → Origin whitelist doesn't include your frontend domain
 * 
 * "Method not allowed by Access-Control-Allow-Methods"
 * → Add the method to ALLOWED_METHODS constant
 * 
 * "Request header not allowed by Access-Control-Allow-Headers"
 * → Add the header to ALLOWED_HEADERS constant
 * 
 * Preflight request fails with 401/403
 * → Don't require auth for OPTIONS requests (they have no token)
 */