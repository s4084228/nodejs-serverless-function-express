import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResponseUtils } from '../utils/ResponseUtils';
import { CorsUtils } from '../utils/CorsUtils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.TOC_SUPABASE_URL!;
const supabaseKey = process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  CorsUtils.setCors(res);
  if (CorsUtils.handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return ResponseUtils.send(res, ResponseUtils.error('Method not allowed', 405));
  }

  try {
    const { type, status, limit = 10, page = 1 } = req.query;
    
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Add filters
    if (type && typeof type === 'string') {
      query = query.eq('type', type);
    }
    
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Add pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    
    query = query.range(from, to);

    const { data: projects, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return ResponseUtils.send(res, ResponseUtils.error('Database error', 500, error.message));
    }

    return ResponseUtils.send(res, ResponseUtils.success({
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: projects?.length || 0
      }
    }, 'Projects retrieved successfully'));

  } catch (err) {
    console.error('API Error:', err);
    return ResponseUtils.send(res, ResponseUtils.error('Failed to retrieve projects', 500));
  }
}