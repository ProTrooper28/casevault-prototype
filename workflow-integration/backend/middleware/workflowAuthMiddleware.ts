/**
 * Express middleware for authentication and role verification.
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext, UserRole } from '../../types/workflow.types';
import { IAuthService } from '../../types/integration.types';

declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext;
    }
  }
}

export class WorkflowAuthMiddleware {
  constructor(private authService: IAuthService) {}

  /**
   * Resolves authenticated user from token or header and attaches to request
   */
  public authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers['authorization'] || (req.headers['x-user-id'] as string);
      const user = await this.authService.getCurrentUser(authHeader);
      req.userContext = user;
      next();
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: err.message || 'Invalid or missing security token',
      });
    }
  };

  /**
   * Enforces specific roles for an endpoint
   */
  public requireRoles = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = req.userContext;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized', message: 'No user session found' });
        return;
      }

      if (user.role === UserRole.SYSTEM_ADMIN) {
        next();
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `User role '${user.role}' lacks permission for this workflow operation. Permitted: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      next();
    };
  };
}
