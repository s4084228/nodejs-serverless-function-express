import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ProjectData } from '../entities/ProjectData';
import { ResponseUtils } from '../utils/ResponseUtils';
import { CorsUtils } from '../utils/CorsUtils';
import { ValidationUtils } from '../utils/ValidationUtils';
import { createClient } from '@supabase/supabase-js';
// import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.TOC_SUPABASE_URL!;
const supabaseKey = process.env.TOC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

      const dbProjectData = {
          id: projectId,
          project_title: projectData.projectTitle,
          big_picture_goal: projectData.bigPictureGoal,
          project_aim: projectData.projectAim,
          objectives: projectData.objectives,
          beneficiaries: projectData.beneficiaries,
          activities: projectData.activities,
          outcomes: projectData.outcomes,
          external_factors: projectData.externalFactors,
          evidence_links: projectData.evidenceLinks,
          status: projectData.status,
          type: 'project',
          created_at: timestamp,
          updated_at: timestamp
    };

    // Insert into Supabase
    const { data: insertedProject, error: dbError } = await supabase
      .from('projects')
      .insert([dbProjectData])
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      return ResponseUtils.send(res, ResponseUtils.error('Database error', 500, dbError.message));
    }

    // BLOB STORAGE (COMMENTED FOR NOW)
    /*
    // Save to Blob storage
    const filename = `projects/${projectId}.json`;
    const { url: blobUrl } = await put(filename, JSON.stringify(projectWithMeta, null, 2), {
      access: 'public',
      contentType: 'application/json'
    });

    // Return response with blob URL
    return ResponseUtils.send(res, ResponseUtils.success({
      ...insertedProject,
      blobUrl
    }, 'Project created and saved to both database and blob storage', 201));
    */

    // Return response with database data
    return ResponseUtils.send(res, ResponseUtils.success(
      insertedProject, 
      'Project created and saved to database', 
      201
    ));

  } catch (err) {
    console.error('API Error:', err);
    return ResponseUtils.send(res, ResponseUtils.error('Failed to create project', 500));
  }
}
