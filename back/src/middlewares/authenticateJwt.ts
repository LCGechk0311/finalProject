import { Response, NextFunction } from 'express';
import passport from 'passport';
import { IRequest } from 'types/request';
import { IUser } from 'types/user';
import { verifyRefreshToken } from '../utils/tokenUtils';
import jwt, { JwtPayload } from 'jsonwebtoken';

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
          const decodedToken = jwt.decode(
            req.cookies.accessToken,
          ) as JwtPayload;
          if (decodedToken) {
            const isRefreshTokenExpired = await verifyRefreshToken(
              req.cookies.newRefreshToken,
              decodedToken.id,
            );

            if (isRefreshTokenExpired) {
              return res.status(401).json({ message: 'refreshToken만료' });
            } else {
              return res.status(401).json({ message: 'accesstoken 갱신 필요' });
            }
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
