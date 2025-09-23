import ValidationUtils from './ValidationUtils';

// services/validators/index.ts
export class Validators {
  static createProject(data: any): string[] {
    const errors: string[] = [];
    //if (!data.userId) errors.push('userId is required');
    if (!data.projectTitle) errors.push('projectTitle is required');
    return errors;
  }

      // In services/validators/index.ts
    static updateProject(data: any): string[] {
      const errors: string[] = [];
  
      if (!data.projectId || typeof data.projectId !== 'string') {
        errors.push('projectId is required and must be a string');
      }
  
      if (!data.projectTitle || typeof data.projectTitle !== 'string') {
        errors.push('projectTitle is required and must be a string');
      }
  
      return errors;
    }

 
static deleteProject(data: any): string[] {
  const errors: string[] = [];
  
  if (!data.projectId || typeof data.projectId !== 'string') {
    errors.push('projectId is required and must be a string');
  }
  
  return errors;
}

  static userRegistration(data: any): string[] {
    const errors: string[] = [];
    if (!data.email || !ValidationUtils.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    if (!data.password) {
      errors.push('Password is required');
    } else {
      const passwordValidation = ValidationUtils.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        errors.push(passwordValidation.message);
      }
    }
    return errors;
  }

  static userLogin(data: any): string[] {
    const errors: string[] = [];
    if (!data.email || !ValidationUtils.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }
    if (!data.password) errors.push('Password is required');
    return errors;
  }

  // In services/validators/index.ts
static userUpdate(data: any): string[] {
  const errors: string[] = [];
  
  // Remove email validation - it comes from JWT now
  // if (!data.email || !ValidationUtils.isValidEmail(data.email)) {
  //   errors.push('Valid email is required');
  // }

  // Optional username validation
  if (data.username !== undefined && data.username && !ValidationUtils.isValidUsername(data.username)) {
    errors.push('Username must be 3-30 characters and contain only letters, numbers, and underscores');
  }

  return errors;
}

static userDelete(data: any): string[] {
  const errors: string[] = [];
  
  // Remove email validation - it comes from JWT now
  // if (!data.email || !ValidationUtils.isValidEmail(data.email)) {
  //   errors.push('Valid email is required');
  // }
  
  if (!data.confirmDelete) {
    errors.push('Account deletion must be confirmed by setting confirmDelete to true');
  }
  
  return errors;
}


static passwordReset = (data: any): string[] => {
    const errors: string[] = [];
    
    // Check if data exists (this is req.body)
    if (!data) {
        errors.push('Request body is required');
        return errors;
    }
    
    // Now safely destructure from data (which is req.body from HandlerFactory)
    const { email, action, token, newPassword } = data;
    
    if (!email) {
        errors.push('Email is required');
    } else if (!ValidationUtils.isValidEmail(email)) {
        errors.push('Valid email is required');
    }
    
    if (!action) {
        errors.push('Action is required');
    } else if (!['request-reset', 'verify-token'].includes(action)) {
        errors.push('Invalid action. Must be "request-reset" or "verify-token"');
    }
    
    if (action === 'verify-token') {
        if (!token) {
            errors.push('Token is required for verify-token action');
        }
        if (!newPassword) {
            errors.push('New password is required for verify-token action');
        } else {
            const passwordValidation = ValidationUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                errors.push(passwordValidation.message);
            }
        }
    }
    
    return errors;
};

}