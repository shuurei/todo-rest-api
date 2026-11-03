export class HttpNotFoundError extends Error {
    statusCode: number;

    constructor(message = 'NOT_FOUND') {
        super(message);
        this.name = 'NOT_FOUND';
        this.statusCode = 404;
    }
}

export class HttpConflictError extends Error {
    statusCode: number;

    constructor(message = 'CONFLICT') {
        super(message);
        this.name = 'CONFLICT';
        this.statusCode = 409;
    }
}

export class HttpUnauthorizedError extends Error {
    statusCode: number;

    constructor(message = 'UNAUTHORIZED') {
        super(message);
        this.name = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}

export class HttpForbiddenError extends Error {
    statusCode: number;

    constructor(message = 'FORBIDDEN') {
        super(message);
        this.name = 'FORBIDDEN';
        this.statusCode = 403;
    }
}