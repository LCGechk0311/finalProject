import passport from 'passport';
import { Response, NextFunction } from 'express';
import { IUser } from 'types/user';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenUtils';
import { IRequest } from 'types/request';
import { setCookie } from '../utils/responseData';
import { redisCli } from '../utils/DB';

export const localAuthentication = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    passport.authenticate(
      'local',
      { session: false },
      async (error: Error, user: IUser, info: any) => {
        if (error) {
          next(error);
        }
        if (info) {
          next(info);
        }
        if (user) {
          const { token, expiresAt } = generateAccessToken(user.id);

          const refreshToken = await generateRefreshToken(user.id);

          req.user = user;
          // accessToken 쿠키 설정
          setCookie(res, 'accessToken', token, expiresAt);

          // newRefreshToken 쿠키 설정
          setCookie(
            res,
            'newRefreshToken',
            refreshToken.token,
            refreshToken.expireIn,
          );
          return next();
        }
      },
    )(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const sessionLocalAuthentication = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    passport.authenticate(
      'local',
      { session: true },
      async (error: Error, user: IUser, info: any) => {
        if (error) {
          next(error);
        }
        if (info) {
          next(info);
        }
        if (user) {
          const sessionData = {
            userId: user.id,
            displayName: user.username,
          };
          const sessionKey = `${req.sessionID}`;
          await redisCli.set(sessionKey, JSON.stringify(sessionData));

          req.user = user;
          req.session.is_logined = true;
          req.session.userId = user.id;
          req.session.dispayName = user.username;
          return next();
        }
      },
    )(req, res, next);
  } catch (error) {
    next(error);
  }
};
