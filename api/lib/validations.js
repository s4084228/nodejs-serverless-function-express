export const validateProject = (data) => {
    const errors = [];

    if (!data.projectTitle || typeof data.projectTitle !== 'string') {
        errors.push('projectTitle is required and must be a string');
    }

    if (!data.bigPictureGoal || typeof data.bigPictureGoal !== 'string') {
        errors.push('bigPictureGoal is required and must be a string');
    }

    // ... rest of validation logic

    return errors;
};

export const validateUser = (data) => {
    const errors = [];

    if (!data.email || !data.email.includes('@')) {
        errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    return errors;
};