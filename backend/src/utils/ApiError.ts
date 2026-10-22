// utils/ApiError.ts
// Error de aplicación con código HTTP, capturado por el middleware de errores.
export class ApiError extends Error {
  readonly status: number;
  readonly details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: string[]): ApiError {
    return new ApiError(400, message, details);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static unauthorized(message: string, details?: string[]): ApiError {
    return new ApiError(401, message, details);
  }

  static conflict(message: string, details?: string[]): ApiError {
    return new ApiError(409, message, details);
  }
}
