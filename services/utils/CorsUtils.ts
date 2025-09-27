import type { VercelRequest, VercelResponse } from '@vercel/node';

export class CorsUtils {
  static setCors(res: VercelResponse, req: VercelRequest): void {
    const origin = req.headers.origin || '';
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://toc-user-backend.vercel.app'
    ];

    // Check if origin is localhost (any port) or in allowed origins
    const isLocalhost = origin.startsWith('http://localhost:') || 
                       origin.startsWith('http://127.0.0.1:');
    const isAllowed = allowedOrigins.includes(origin);

    // ALWAYS set CORS headers (even if origin not matched)
    if (isLocalhost || isAllowed || origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  static handleOptions(req: VercelRequest, res: VercelResponse): boolean {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
    return false;
  }
}