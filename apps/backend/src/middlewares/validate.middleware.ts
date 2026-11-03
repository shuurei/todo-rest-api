import type { Request, Response, NextFunction } from 'express'
import z from 'zod'

const getHttpStatusFromZodError = (error: z.ZodError) => {
    let finalStatus = 400;

    for (const issue of error.issues) {
        switch (issue.code) {
            case 'invalid_format':
            case 'invalid_value':
            case 'invalid_key':
            case 'invalid_element':
            case 'too_small':
            case 'too_big':
            case 'not_multiple_of':
            case 'invalid_union':
            case 'custom': {
                finalStatus = 422;
                break;
            }
        }
    }

    return finalStatus;
}

export const validateBody = <T extends z.ZodType>(schema: T) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);

        return next();
    } catch (err) {
        if (!(err instanceof z.ZodError)) {
            return next(err)
        }

        console.error(err);

        res.status(getHttpStatusFromZodError(err)).json({
            errors: err.issues.reduce((acc, issue) => {
                acc[issue.path.join('.')] = issue.code.toUpperCase();

                return acc;
            }, {})
        });
    }
}