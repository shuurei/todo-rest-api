import swaggerJsdoc from 'swagger-jsdoc'

import { schemas } from './schemas'
import { responses } from './responses'

export const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Todo Rest API',
            version: '0.0.0'
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User registration, login and session management'
            },
            {
                name: 'Users',
                description: 'User management'
            },
            {
                name: 'Todos',
                description: 'Todo management'
            }
        ],
        components: {
            securitySchemes: {
                TOKEN: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas,
            responses
        }
    },
    apis: ['./*/**']
});
