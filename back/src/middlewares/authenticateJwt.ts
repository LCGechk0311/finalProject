import { Response, NextFunction } from 'express';
import passport from 'passport';
import { IRequest } from 'types/request';
import { IUser } from 'types/user';
import { verifyRefreshToken } from '../utils/tokenUtils';

export const jwtAuthentication = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    passport.authenticate(
      'jwt',
      { session: false },
      async (error: Error, user: IUser, info: any) => {
        if (error) {
          // console.log(error);
          next(error);
        }
        if (info) {
          // accesstoken 추가 관련 시나리오 추가
          // Access Token 만료, Refresh Token 만료 여부 확인
          const isRefreshTokenExpired = await verifyRefreshToken(req.cookies.newRefreshToken);

          if (isRefreshTokenExpired) {
            return res.status(401).json({ message: '갱신 필요' });
          } else {
            return res.status(401).json({ message: 'refreshToken만료' });
          }
        }
        req.user = user;
        next();
      },
    )(req, res, next);
  } catch (error) {
    // console.log(error);
    next(error);
  }
};
