// Custom error classes for the application

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// Helper function to handle errors in API routes
export function handleApiError(error: unknown): { status: number; message: string; code?: string } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      message: error.message,
      code: error.code
    };
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error);
    return {
      status: 500,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    };
  }

  return {
    status: 500,
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

