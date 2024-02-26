import passport from 'passport';
import { Response, NextFunction } from 'express';
import { IUser } from 'types/user';
import {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshTokenInDatabase,
} from '../utils/tokenUtils';
import { IRequest } from 'types/request';
import { setCookie } from '../utils/responseData';

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
          console.log(error);
          next(error);
        }

        if (info) {
          console.log(info);
          next(info);
        }

        if (user) {
          const { token, expiresAt } = generateAccessToken(user);

          const refreshToken = await generateRefreshToken(user.id);
          // await storeRefreshTokenInDatabase(user.id, refreshToken);

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
