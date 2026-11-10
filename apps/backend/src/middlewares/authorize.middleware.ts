import type { Request, Response, NextFunction } from 'express'
import type { User } from '../entities/user.entity'
import { UserService } from '../services/user.service'
import { HttpForbiddenError, HttpUnauthorizedError } from '../utils/http-errors'

export type Policy<Resource> = (actor: User, resource: Resource) => boolean | Promise<boolean>;

export function authorize<Resource>(policy: Policy<Resource>, resolveResource: (req: Request) => Resource | Promise<Resource>) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        if (!req.userId) {
            throw new HttpUnauthorizedError();
        }

        const actor = await UserService.repo.findOneBy({ id: req.userId });
        if (!actor) {
            throw new HttpUnauthorizedError();
        }

        UserService.assertCanAuthenticate(actor);
        const resource = await resolveResource(req);
        if (!await policy(actor, resource)) {
            throw new HttpForbiddenError();
        }

        return next();
    };
}
