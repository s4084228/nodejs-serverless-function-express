import type { VercelResponse } from '@vercel/node';
import type { ApiResponse } from '../entities/ApiResponse';

/*export class ResponseUtils {
  static success(data: any, message = 'Success', statusCode = 200): ApiResponse {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  static error(message: string, statusCode = 500, details?: any): ApiResponse {
    return {
      success: false,
      message,
      error: details,
      statusCode
    };
  }

  static send(res: VercelResponse, response: ApiResponse) {
    return res.status(response.statusCode).json(response);
  }
}*/



export class ResponseUtils {
  static success(data: any, message = 'Success', statusCode = 200): ApiResponse {
    return {
      success: true,
      message,
      data,
      statusCode
    };
  }

  static error(message: string, statusCode = 500, details?: any): ApiResponse {
    return {
      success: false,
      message,
      error: details,
      statusCode
    };
  }

  static send(res: VercelResponse, response: ApiResponse): void {
    res.status(response.statusCode).json(response);
  }

  static created(data: any, message = 'Created successfully'): ApiResponse {
    return this.success(data, message, 201);
  }

  static conflict(message = 'Resource already exists'): ApiResponse {
    return this.error(message, 409);
  }

  // Move this INSIDE the class
  static unauthorized(message = 'Unauthorized'): ApiResponse {
    return this.error(message, 401);
  }

  static notFound(message = 'Resource not found'): ApiResponse {
    return this.error(message, 404);
  }

  static validationError(errors: string[]): ApiResponse {
    return this.error('Validation failed', 400, errors);
  }

  static updated(data: any, message = 'Updated successfully'): ApiResponse {
    return this.success(data, message, 200);
  }

  static deleted(data: any = {}, message = 'Deleted successfully'): ApiResponse {
    return this.success(data, message, 200);
  }

  static handleServiceError(error: any): ApiResponse {
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('Validation') || error.message.includes('required')) {
        statusCode = 400;
      } else if (error.message.includes('not found') || error.message.includes('access denied')) {
        statusCode = 404;
      } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        statusCode = 409;
      }
    }

    return this.error(errorMessage, statusCode);
  }
}