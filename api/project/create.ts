// File: api/toc/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types
interface ProjectData {
  projectTitle: string;
  bigPictureGoal: string;
  projectAim: string;
  objectives: string[];
  beneficiaries: {
    description: string;
    estimatedReach: number;
  };
  activities: string[];
  outcomes: string[];
  externalFactors: string[];
  evidenceLinks: string[];
  status: 'draft' | 'published';
  type?: 'project' | 'toc';
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  statusCode: number;
}

// Utility functions
const success = (data: any, message = 'Success', statusCode = 200): ApiResponse => ({
  success: true,
  message,
  data,
  statusCode
});

const error = (message: string, statusCode = 500, details?: any): ApiResponse => ({
  success: false,
  message,
  error: details,
  statusCode
});

const sendResponse = (res: VercelResponse, response: ApiResponse) => {
  return res.status(response.statusCode).json(response);
};

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const handleOptions = (req: VercelRequest, res: VercelResponse): boolean => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

const validateProject = (data: ProjectData): string[] => {
  const errors: string[] = [];
  
  if (!data.projectTitle || typeof data.projectTitle !== 'string') {
    errors.push('projectTitle is required and must be a string');
  }
  
  if (!data.bigPictureGoal || typeof data.bigPictureGoal !== 'string') {
    errors.push('bigPictureGoal is required and must be a string');
  }
  
  if (!data.projectAim || typeof data.projectAim !== 'string') {
    errors.push('projectAim is required and must be a string');
  }
  
  if (!Array.isArray(data.objectives)) {
    errors.push('objectives must be an array');
  }
  
  if (!data.beneficiaries || typeof data.beneficiaries !== 'object') {
    errors.push('beneficiaries must be an object');
  } else {
    if (!data.beneficiaries.description || typeof data.beneficiaries.description !== 'string') {
      errors.push('beneficiaries.description is required and must be a string');
    }
    if (typeof data.beneficiaries.estimatedReach !== 'number') {
      errors.push('beneficiaries.estimatedReach must be a number');
    }
  }
  
  if (!Array.isArray(data.activities)) {
    errors.push('activities must be an array');
  }
  
  if (!Array.isArray(data.outcomes)) {
    errors.push('outcomes must be an array');
  }
  
  if (!Array.isArray(data.externalFactors)) {
    errors.push('externalFactors must be an array');
  }
  
  if (!Array.isArray(data.evidenceLinks)) {
    errors.push('evidenceLinks must be an array');
  }
  
  if (!['draft', 'published'].includes(data.status)) {
    errors.push('status must be either "draft" or "published"');
  }
  
  return errors;
};

// Main handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, error('Method not allowed', 405));
  }

  try {
    const projectData: ProjectData = req.body;
    const { type = 'toc' } = projectData; // Default to 'toc' for this endpoint
    
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
      type: 'toc', // Force type to 'toc' for this endpoint
      created_at: timestamp,
      updated_at: timestamp
    };

    // Mock successful response
    return sendResponse(res, success(projectWithMeta, 'TOC created successfully', 201));

  } catch (err) {
    console.error('API Error:', err);
    return sendResponse(res, error('Internal server error', 500));
  }
}

// File: api/projects/create.ts (Updated version)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendResponse(res, error('Method not allowed', 405));
  }

  try {
    const projectData: ProjectData = req.body;
    const { type = 'project' } = projectData; // Default to 'project' for this endpoint
    
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
      type: 'project', // Force type to 'project' for this endpoint
      created_at: timestamp,
      updated_at: timestamp
    };

    // Mock successful response
    return sendResponse(res, success(projectWithMeta, 'Project created successfully', 201));

  } catch (err) {
    console.error('API Error:', err);
    return sendResponse(res, error('Internal server error', 500));
  }
}

// File: package.json dependencies to add
/*
{
  "dependencies": {
    "@vercel/node": "^3.0.11"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.4"
  }
}
*/

// File: tsconfig.json
/*
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["api/**\\/*"],
  "exclude": ["node_modules"]
}
*/