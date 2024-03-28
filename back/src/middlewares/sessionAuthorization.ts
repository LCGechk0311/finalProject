import { IRequest } from 'types/request';
import { Response, NextFunction } from 'express';
import redisClient from '../utils/DB';

export const requireAuthentication = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionDataString = await redisClient.get(`session:${req.sessionID}`);

    if (sessionDataString) {
      const sessionData = JSON.parse(sessionDataString);

      if (sessionData.userId === req.session.userId) {
        next();
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    // Handle Redis errors
    console.error('Redis error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

