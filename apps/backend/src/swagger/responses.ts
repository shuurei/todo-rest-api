export const responses = {
    BadRequest: {
        description: 'Invalid request parameters or body'
    },
    Unauthorized: {
        description: 'Authentication is required or the provided token is invalid'
    },
    Forbidden: {
        description: 'You do not have permission to perform this action'
    },
    NotFound: {
        description: 'The requested resource was not found'
    },
    Conflict: {
        description: 'The request could not be completed due to a conflict with the current state of the target resource'
    },
    InternalServerError: {
        description: 'An unexpected server error occurred'
    }
}