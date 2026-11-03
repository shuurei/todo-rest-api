import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'

export const resolveMe = (req: AuthRequest, _res: Response, next: NextFunction) => {
	if (req.params.userId === '@me') {
		req.params.userId = req.userId;
	}

	return next();
}