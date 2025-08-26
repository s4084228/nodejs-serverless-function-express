import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ProjectData } from '../entities/ProjectData';
import { ResponseUtils } from '../utils/ResponseUtils';
import { CorsUtils } from '../utils/CorsUtils';
import { ValidationUtils } from '../utils/ValidationUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  CorsUtils.setCors(res);
  if (CorsUtils.handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return ResponseUtils.send(res, ResponseUtils.error('Method not allowed', 405));
  }

  try {
    const projectData: ProjectData = req.body;
    
    // Validate input
    const validationErrors = ValidationUtils.validateProject(projectData);
    if (validationErrors.length > 0) {
      return ResponseUtils.send(res, ResponseUtils.error('Validation failed', 400, validationErrors));
    }

    // Add metadata
    const timestamp = new Date().toISOString();
    const projectWithMeta = {
      ...projectData,
      id: crypto.randomUUID(),
      type: 'project', // Force type to 'project' for this endpoint
      created_at: timestamp,
      updated_at: timestamp
    };

    return ResponseUtils.send(res, ResponseUtils.success(projectWithMeta, 'Project created successfully', 201));

  } catch (err) {
    console.error('API Error:', err);
    return ResponseUtils.send(res, ResponseUtils.error('Internal server error', 500));
  }
}