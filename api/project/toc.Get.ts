import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ResponseUtils } from '../utils/ResponseUtils';
import { CorsUtils } from '../utils/CorsUtils';
import { head } from '@vercel/blob';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  CorsUtils.setCors(res);
  if (CorsUtils.handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return ResponseUtils.send(res, ResponseUtils.error('Method not allowed', 405));
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return ResponseUtils.send(res, ResponseUtils.error('Project ID is required', 400));
    }

    // Get blob info
    const filename = `projects/${id}.json`;
    const blobInfo = await head(filename);
    
    if (!blobInfo) {
      return ResponseUtils.send(res, ResponseUtils.error('Project not found', 404));
    }

    // Fetch project data
    const response = await fetch(blobInfo.url);
    const projectData = await response.json();

    return ResponseUtils.send(res, ResponseUtils.success(projectData, 'Project retrieved successfully'));

  } catch (err) {
    console.error('API Error:', err);
    return ResponseUtils.send(res, ResponseUtils.error('Failed to retrieve project', 500));
  }
}