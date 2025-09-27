import type { VercelRequest, VercelResponse } from '@vercel/node';


export class CorsUtils {
  static setCors(res: VercelResponse, req: VercelRequest): void {
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
    
    console.log('Setting CORS for origin:', origin);
    
    res.setHeader('Access-Control-Allow-Origin', origin);
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

/*export class CorsUtils {
  static setCors(res: VercelResponse, req: VercelRequest): void {
    const origin = req.headers.origin;
    
    const isLocalhost = origin?.startsWith('http://localhost:') || 
                       origin?.startsWith('http://127.0.0.1:');
    
    // Always set CORS headers
    if (origin && isLocalhost) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (origin) {
      // For other origins, still set it (or reject)
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // No origin header (like direct API calls)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Don't set credentials with * origin
    if (origin) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  static handleOptions(req: VercelRequest, res: VercelResponse): boolean {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return true;
    }
    return false;
  }
}*/