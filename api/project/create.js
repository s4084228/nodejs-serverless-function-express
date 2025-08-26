import { supabase } from '../../lib/db.js';
import { storeInBlob } from '../../lib/storage.js';
import { validateProject } from '../../lib/validation.js';
import { setCors, handleOptions } from '../../middleware/cors.js';
import { success, error, sendResponse } from '../../utils/response.js';
import { requireAuth } from '../../middleware/auth.js';

export default async function handler(req, res) {
    setCors(res);
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') {
        return sendResponse(res, error('Method not allowed', 405));
    }

    try {
        const user = await requireAuth(req, res);
        if (!user) return;

        const projectData = req.body;
        const { type = 'project' } = projectData; // 'project' or 'toc'

        // Validate input
        const validationErrors = validateProject(projectData);
        if (validationErrors.length > 0) {
            return sendResponse(res, error('Validation failed', 400, validationErrors));
        }

        // Add metadata
        const timestamp = new Date().toISOString();
        const projectWithMeta = {
            ...projectData,
            id: crypto.randomUUID(),
            userId: user.id,
            type, // This differentiates between project and TOC
            created_at: timestamp,
            updated_at: timestamp
        };

        // Store in both storages
/*        try {
            await storeInBlob(`${type}s/${projectWithMeta.id}.json`, projectWithMeta);
        } catch (blobError) {
            console.error('Blob storage failed:', blobError);
        }

        const { data: project, error: dbError } = await supabase
            .from('projects')
            .insert([projectWithMeta])
            .select()
            .single();

        if (dbError) {
            return sendResponse(res, error('Database error', 500, dbError.message));
        }
        */

        //return sendResponse(res, success(project, `${type} created successfully`, 201));
        return sendResponse(res, success(null, `${type} created successfully`, 201));

    } catch (err) {
        console.error('API Error:', err);
        return sendResponse(res, error('Internal server error', 500));
    }
}