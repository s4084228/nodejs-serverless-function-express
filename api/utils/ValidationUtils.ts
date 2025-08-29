import  ProjectData from '../entities/ProjectData';

export default class ValidationUtils {

    /**
     * Validates project data for CREATE operation
     * Only userId and projectTitle are required
     */
    static validateProjectForCreate(data: any): string[] {
        const errors: string[] = [];

        // Mandatory fields for create
        if (!data.userId || typeof data.userId !== 'string') {
            errors.push('userId is required and must be a string');
        }

        if (!data.projectTitle || typeof data.projectTitle !== 'string') {
            errors.push('projectTitle is required and must be a string');
        }

        // Optional field validations (only if provided)
        if (data.bigPictureGoal !== undefined && data.bigPictureGoal !== null) {
            if (typeof data.bigPictureGoal !== 'string') {
                errors.push('bigPictureGoal must be a string');
            }
        }

        if (data.projectAim !== undefined && data.projectAim !== null) {
            if (typeof data.projectAim !== 'string') {
                errors.push('projectAim must be a string');
            }
        }

        if (data.objectives !== undefined && data.objectives !== null) {
            if (!Array.isArray(data.objectives)) {
                errors.push('objectives must be an array');
            }
        }

        if (data.beneficiaries !== undefined && data.beneficiaries !== null) {
            if (typeof data.beneficiaries !== 'object') {
                errors.push('beneficiaries must be an object');
            } else {
                if (data.beneficiaries.description !== undefined && typeof data.beneficiaries.description !== 'string') {
                    errors.push('beneficiaries.description must be a string');
                }
                if (data.beneficiaries.estimatedReach !== undefined && typeof data.beneficiaries.estimatedReach !== 'number') {
                    errors.push('beneficiaries.estimatedReach must be a number');
                }
            }
        }

        if (data.activities !== undefined && data.activities !== null) {
            if (!Array.isArray(data.activities)) {
                errors.push('activities must be an array');
            }
        }

        if (data.outcomes !== undefined && data.outcomes !== null) {
            if (!Array.isArray(data.outcomes)) {
                errors.push('outcomes must be an array');
            }
        }

        if (data.externalFactors !== undefined && data.externalFactors !== null) {
            if (!Array.isArray(data.externalFactors)) {
                errors.push('externalFactors must be an array');
            }
        }

        if (data.evidenceLinks !== undefined && data.evidenceLinks !== null) {
            if (!Array.isArray(data.evidenceLinks)) {
                errors.push('evidenceLinks must be an array');
            }
        }

        if (data.status !== undefined && data.status !== null) {
            if (!['draft', 'published', 'active', 'completed', 'cancelled'].includes(data.status)) {
                errors.push('status must be one of: "draft", "published", "active", "completed", "cancelled"');
            }
        }

        return errors;
    }

    /**
     * Validates project data for UPDATE operation
     * userId, projectId, and projectTitle are required
     */
    static validateProjectForUpdate(data: any): string[] {
        const errors: string[] = [];

        // Mandatory fields for update
        if (!data.userId || typeof data.userId !== 'string') {
            errors.push('userId is required and must be a string');
        }

        if (!data.projectId || typeof data.projectId !== 'string') {
            errors.push('projectId is required and must be a string');
        }

        if (!data.projectTitle || typeof data.projectTitle !== 'string') {
            errors.push('projectTitle is required and must be a string');
        }

        // Optional field validations (same as create, only if provided)
        if (data.bigPictureGoal !== undefined && data.bigPictureGoal !== null) {
            if (typeof data.bigPictureGoal !== 'string') {
                errors.push('bigPictureGoal must be a string');
            }
        }

        if (data.projectAim !== undefined && data.projectAim !== null) {
            if (typeof data.projectAim !== 'string') {
                errors.push('projectAim must be a string');
            }
        }

        if (data.objectives !== undefined && data.objectives !== null) {
            if (!Array.isArray(data.objectives)) {
                errors.push('objectives must be an array');
            }
        }

        if (data.beneficiaries !== undefined && data.beneficiaries !== null) {
            if (typeof data.beneficiaries !== 'object') {
                errors.push('beneficiaries must be an object');
            } else {
                if (data.beneficiaries.description !== undefined && typeof data.beneficiaries.description !== 'string') {
                    errors.push('beneficiaries.description must be a string');
                }
                if (data.beneficiaries.estimatedReach !== undefined && typeof data.beneficiaries.estimatedReach !== 'number') {
                    errors.push('beneficiaries.estimatedReach must be a number');
                }
            }
        }

        if (data.activities !== undefined && data.activities !== null) {
            if (!Array.isArray(data.activities)) {
                errors.push('activities must be an array');
            }
        }

        if (data.outcomes !== undefined && data.outcomes !== null) {
            if (!Array.isArray(data.outcomes)) {
                errors.push('outcomes must be an array');
            }
        }

        if (data.externalFactors !== undefined && data.externalFactors !== null) {
            if (!Array.isArray(data.externalFactors)) {
                errors.push('externalFactors must be an array');
            }
        }

        if (data.evidenceLinks !== undefined && data.evidenceLinks !== null) {
            if (!Array.isArray(data.evidenceLinks)) {
                errors.push('evidenceLinks must be an array');
            }
        }

        if (data.status !== undefined && data.status !== null) {
            if (!['draft', 'published', 'active', 'completed', 'cancelled'].includes(data.status)) {
                errors.push('status must be one of: "draft", "published", "active", "completed", "cancelled"');
            }
        }

        return errors;
    }

    /**
     * Legacy method for backward compatibility
     * Now validates as if it's a complete project (stricter validation)
     */
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

        if (!['draft', 'published', 'active', 'completed', 'cancelled'].includes(data.status)) {
            errors.push('status must be one of: "draft", "published", "active", "completed", "cancelled"');
        }

        return errors;
    }

    /**
     * Validates common field formats regardless of operation
     */
    static validateFieldFormats(data: any): string[] {
        const errors: string[] = [];

        // Email validation if userId looks like email
        if (data.userId && data.userId.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.userId)) {
                errors.push('userId must be a valid email format');
            }
        }

        // Project title length validation
        if (data.projectTitle && data.projectTitle.length > 200) {
            errors.push('projectTitle must not exceed 200 characters');
        }

        // URLs validation in evidenceLinks
        if (data.evidenceLinks && Array.isArray(data.evidenceLinks)) {
            data.evidenceLinks.forEach((link: any, index: number) => {
                if (typeof link === 'string') {
                    try {
                        new URL(link);
                    } catch {
                        errors.push(`evidenceLinks[${index}] must be a valid URL`);
                    }
                }
            });
        }

        return errors;
    }
}