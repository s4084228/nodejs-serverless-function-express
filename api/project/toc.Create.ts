import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ProjectData } from '../entities/ProjectData';
import { ResponseUtils } from '../utils/ResponseUtils';
import { CorsUtils } from '../utils/CorsUtils';
import { ValidationUtils } from '../utils/ValidationUtils';
import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

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
    const projectId = randomUUID();
    const projectWithMeta = {
      ...projectData,
      id: projectId,
      type: 'project',
      created_at: timestamp,
      updated_at: timestamp
    };

    // Save to Blob storage
    const filename = `projects/${projectId}.json`;
    const { url: blobUrl } = await put(filename, JSON.stringify(projectWithMeta, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });

    // Return response with blob URL
    return ResponseUtils.send(res, ResponseUtils.success({
      ...projectWithMeta,
      blobUrl
    }, 'Project created and saved to blob storage', 201));

  } catch (err) {
    console.error('API Error:', err);
    return ResponseUtils.send(res, ResponseUtils.error('Failed to create project', 500));
  }
}