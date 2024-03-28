import { IRequest } from 'types/request';
import { Request, Response, NextFunction } from 'express';

export const requireSession = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.session) {
    console.log(req.session);
    next();
  } else {
    console.log(req.session);
    console.log(req.cookies);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireAuthentication = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  const sessionId = req.cookies.sessionId;
  console.log(sessionId);

  if (sessionId && sessionStorage.has(sessionId)) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

