export class AppError extends Error {
  #statusCode: number;
  #status: "fail" | "error";
  #reason: string | null;
  #isOperational: true;

  constructor(message: string, statusCode: number = 500, reason?: string) {
    super(message);

    this.#statusCode = statusCode;
    this.#status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.#reason = reason ?? null;
    this.#isOperational = true;
  }

  get statusCode() {
    return this.#statusCode;
  }
  get status() {
    return this.#status;
  }
  get reason() {
    return this.#reason;
  }
  get isOperational() {
    return this.#isOperational;
  }
}

export class NoAccessTokenError extends AppError {
  constructor(message = "Unauthorized Access: Authenticated users only") {
    super(message, 401, "no-access-token");
  }
}

export class InvalidSignupDataError extends AppError {
  constructor(message = "Sign-up Failed: Invalid sign-up data received") {
    super(message, 400, "invalid-signup");
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = "An account with this email already exists") {
    super(message, 409, "email-already-exists");
  }
}

export class UsernameTakenError extends AppError {
  constructor(message = "This username is already taken") {
    super(message, 409, "username-taken");
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = "Login failed: Invalid credentials") {
    super(message, 401, "invalid-credentials");
  }
}

export class InvalidTokenError extends AppError {
  constructor(message = "Unauthorized Access: Invalid token") {
    super(message, 401, "invalid-token");
  }
}

export class InvalidSessionError extends AppError {
  constructor(message = "Unauthorized Access: Session invalid") {
    super(message, 401, "invalid-session");
  }
}

export class AccessTokenExpiredError extends AppError {
  constructor(message = "Unauthorized Access: Access token expired") {
    super(message, 401, "access-token-expired");
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = "Session expired. Please log in again") {
    super(message, 401, "session-expired");
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = "User not found") {
    super(message, 404, "user-not-found");
  }
}

export class PasswordChangedReloginError extends AppError {
  constructor(message = "Please log in with your updated password") {
    super(message, 401, "password-changed");
  }
}

export class SessionCompromisedError extends AppError {
  constructor(message = "Session compromised. Logged out of all devices") {
    super(message, 403, "session-compromised");
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedAccessError extends AppError {
  constructor(message = "Unauthorized Access") {
    super(message, 401);
  }
}

export class ForbiddenAccessError extends AppError {
  constructor(message = "Forbidden: Authorization Failed") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource Not Found") {
    super(message, 404);
  }
}
