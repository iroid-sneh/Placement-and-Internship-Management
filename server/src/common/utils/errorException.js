export const HttpStatus = {
    CONTINUE: 100,
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    GONE: 410,
    PRECONDITION_FAILED: 412,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503,
};

export class Exception extends Error {
    constructor(
        message,
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode = null
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Specific error types
export class BadRequestException extends Exception {
    constructor(message = "Bad request", errorCode = null) {
        super(message, HttpStatus.BAD_REQUEST, errorCode);
    }
}

export class UnauthorizedException extends Exception {
    constructor(message = "Unauthorized", errorCode = null) {
        super(message, HttpStatus.UNAUTHORIZED, errorCode);
    }
}

export class ForbiddenException extends Exception {
    constructor(message = "Access denied", errorCode = null) {
        super(message, HttpStatus.FORBIDDEN, errorCode);
    }
}

export class NotFoundException extends Exception {
    constructor(message = "Resource not found", errorCode = null) {
        super(message, HttpStatus.NOT_FOUND, errorCode);
    }
}

export class ConflictException extends Exception {
    constructor(message = "Conflict", errorCode = null) {
        super(message, HttpStatus.CONFLICT, errorCode);
    }
}

export class GoneException extends Exception {
    constructor(message = "Resource no longer available", errorCode = null) {
        super(message, HttpStatus.GONE, errorCode);
    }
}

export class PreconditionFailedException extends Exception {
    constructor(message = "Precondition failed", errorCode = null) {
        super(message, HttpStatus.PRECONDITION_FAILED, errorCode);
    }
}

export class UnprocessableEntityException extends Exception {
    constructor(message = "Unprocessable entity", errorCode = null) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }
}

export class TooManyRequestsException extends Exception {
    constructor(message = "Too many requests", errorCode = null) {
        super(message, HttpStatus.TOO_MANY_REQUESTS, errorCode);
    }
}

export class InternalServerErrorException extends Exception {
    constructor(message = "Internal server error", errorCode = null) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, errorCode);
    }
}

// Optional - useful for schema validation failure (e.g., Joi, Yup)
export class ValidationException extends Exception {
    constructor(
        message = "Validation failed",
        errorCode = "VALIDATION_FAILED"
    ) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }
}
