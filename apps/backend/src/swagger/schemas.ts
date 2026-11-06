export const schemas = {
    Todo: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440000'
            },
            title: {
                type: 'string',
                example: 'Finish the project'
            },
            description: {
                type: 'string',
                nullable: true,
                example: 'Complete the REST API documentation'
            },
            completed: {
                type: 'boolean',
                example: false
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-11-03T12:00:00.000Z'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-11-03T12:30:00.000Z'
            }
        }
    },
    User: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                example: '123'
            },
            displayName: {
                type: 'string',
                nullable: true,
                example: null
            },
            username: {
                type: 'string',
                example: 'admin'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-27T22:30:00.0Z'
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-27T22:30:00.0Z'
            }
        },
    }
}