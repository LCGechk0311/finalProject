import { jwtAuthentication } from '../authenticateJwt';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { IRequest } from 'types/request';
import redisClient from '../../utils/DB';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../utils/tokenUtils';
import { localAuthentication } from '../authenticateLocal';
import { IUser } from 'types/user';
import { setCookie } from '../../utils/responseData';

const req: any = {};
const res: any = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
const next: NextFunction = jest.fn();

jest.mock('passport', () => ({
  authenticate: jest.fn(),
}));

jest.mock('../../utils/tokenUtils', () => ({
  verifyRefreshToken: jest.fn(),
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

jest.mock('../../utils/responseData', () => ({
    setCookie: jest.fn(),
}));

describe('jwtAuthentication', () => {
  const req: any = { cookies: { newRefreshToken: 'mockRefreshToken' } };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Passport 모듈의 authenticate 함수가 에러를 반환', async () => {
    const error = new Error('Authentication error');
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        return callback(error, null, null);
      },
    );

    await jwtAuthentication(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('access token만 만료된 경우', async () => {
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        return callback(null, null, { message: 'Some info message' });
      },
    );
    (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(true);

    await jwtAuthentication(req as IRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: '갱신 필요' });
  });

  it('인증이 성공한 경우', async () => {
    const user = { id: 'mockUserId', username: 'mockUsername' };
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        return callback(null, user, null);
      },
    );
    // (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(false);

    await jwtAuthentication(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('accesstoken, refreshtoken만료', async () => {
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        return callback(null, null, { message: 'Some info message' });
      },
    );
    (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(false);

    await jwtAuthentication(req as IRequest, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'refreshToken만료' });
  });
});

describe('localAuthentication', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

    it('Passport 모듈의 authenticate 함수가 에러를 반환', async () => {
      const error = new Error('Authentication error');
      (passport.authenticate as jest.Mock).mockImplementationOnce(
        (strategy: any, options: any, callback: any) => {
          return callback(error, null, null);
        },
      );

      await jwtAuthentication(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

  it('사용자의 정보가 없을 경우', async () => {
    const info = {
      status: 404,
      message: '사용자를 찾을 수 없습니다.',
    };
    const user: IUser = null; // 사용자 아이디 불일치
    const error: Error = null;
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        callback(error, user, info);
      },
    );

    await localAuthentication(req as IRequest, res, next);

    expect(passport.authenticate).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(info);
  });

  it('비밀번호가 불일치하는 경우', async () => {
    const info = {
      status: 403,
      message: '비밀번호가 일치하지 않습니다. ',
    };
    const user: IUser = null; // 비밀번호 불일치
    const error: Error = null;
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        callback(error, user, info);
      },
    );

    await localAuthentication(req as IRequest, res, next);

    expect(passport.authenticate).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(info);
  });

  it('유저 정보', async () => {
    const user = { id: 'mockUserId', username: 'mockUsername' };
    (passport.authenticate as jest.Mock).mockImplementationOnce(
      (strategy: any, options: any, callback: any) => {
        return callback(null, user, null);
      },
    );

    (generateAccessToken as jest.Mock).mockResolvedValueOnce(true);
    (generateRefreshToken as jest.Mock).mockResolvedValueOnce(true);
    (setCookie as jest.Mock).mockResolvedValueOnce(true);

    await localAuthentication(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});

// beforeAll(() => {
//   // Redis 클라이언트가 이미 연결되어 있는지 확인
//   if (!redisClient.connect) {
//     // Redis 클라이언트가 연결되어 있지 않으면 연결 시도
//     redisClient.connect();
//   }
// });

// afterAll(() => {
//   // Redis 연결 닫기
//   redisClient.quit();
// });
