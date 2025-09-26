import type { VercelRequest, VercelResponse } from '@vercel/node';

export class CorsUtils {
  static setCors(res: VercelResponse, req: VercelRequest): void {
    // Get the origin from the request
    const origin = req.headers.origin || 'http://localhost:3000';
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://toc-user-backend.vercel.app' // Add your production domain
    ];

    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Important!
  }

  static handleOptions(req: VercelRequest, res: VercelResponse): boolean {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
    return false;
  }
}