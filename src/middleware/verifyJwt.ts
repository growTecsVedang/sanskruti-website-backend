import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.utils';

export type VerifyRequest<TParams, TBody, TQuery> = Request<
  TParams,
  {},
  TBody,
  TQuery
>;

const verifyAccessJwt = (req: Request, res: Response, next: NextFunction) => {
  const header = (req.headers['authorization'] ||
    req.headers['Authorization']) as string;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ message: 'access token not found' }); // Unauthorized

  // get access token
  const token = header.split(' ')[1];

  // verify token
  const access_public = process.env.ACCESS_TOKEN_PUBLIC;
  if (!access_public) {
    logger.error('access token public key undefined');
    return res.sendStatus(500);
  }
  jwt.verify(token, access_public, (err, decoded: any) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.body.email = decoded.email;
    req.body.userRole = decoded.userRole;
    next();
  });
};

export default verifyAccessJwt;
