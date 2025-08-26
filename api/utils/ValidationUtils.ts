import type { ProjectData } from '../entities/ProjectData';

export class ValidationUtils {
  static validateProject(data: ProjectData): string[] {
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
  }
}