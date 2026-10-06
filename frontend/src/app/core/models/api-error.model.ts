export interface FieldError {
  field: string;
  message: string;
}

/** Error body returned by the API. Mirrors the backend's ApiError schema. */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: FieldError[];
}

/**
 * What the rest of the app sees when a request fails: the interceptor turns
 * every HTTP failure into one of these, with a message safe to show to users.
 */
export class AppError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached. */
    readonly status: number,
    /** Backend error code, or a client-side one such as NETWORK_ERROR. */
    readonly code: string,
    message: string,
    readonly fieldErrors: readonly FieldError[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
