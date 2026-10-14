import { Request } from 'express';

export type AuthUser = {
  userId: number;
};

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
