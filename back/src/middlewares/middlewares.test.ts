import { userRegister, getMyInfo } from '../controllers/userController';
import { jwtAuthentication } from './authenticateJwt';
import passport from 'passport';
import { localAuthentication } from './authenticateLocal';
import { Request, Response, NextFunction } from 'express';
import { IRequest } from 'types/request';
import redisClient from '../utils/DB';

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('userRegister', () => {
  // it은 test를 대신하는 별칭 -> mocha나 jasmin같은 테스트 라이브러리에서 it을 주로 사용했기에
  it('create user successfully', async () => {
    const req: Partial<Request> = {
      body: {
        username: 'test131user',
        email: 'test367@example.com',
        password: 'password',
      },
    };

    const res = mockResponse();

    await userRegister(req as Request, res);

    expect(res.status).toBeCalledWith(200);
  });
});

describe('getMyInfo', () => {
  const req = {
    user: { id: '03f7b7f0-c311-11ee-a68c-b025aa368a33' },
  };
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };

  test('사용자 정보 추출', async () => {
    await getMyInfo(req as IRequest, res);

    expect(res.status).toBeCalledWith(200);
  });
});

jest.mock('passport', () => ({
  authenticate : jest.fn(),
}));

jest.mock('../utils/tokenUtils', () => ({
  verifyRefreshToken: jest.fn(),
}));

// describe('jwtAuthentication', () => {
//   const req: any = { cookies: { newRefreshToken: 'mockRefreshToken' } };
//   const res: Partial<Response> = {
//     status: jest.fn().mockReturnThis(),
//     json: jest.fn(),
//   };
//   const next: NextFunction = jest.fn();

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('Passport 모듈의 authenticate 함수가 에러를 반환', async () => {
//     const error = new Error('Authentication error');
//     (passport.authenticate as jest.Mock).mockImplementationOnce((strategy: any, options: any, callback: any) => {
//       return callback(error, null, null);
//     });

//     await jwtAuthentication(req, res as Response, next);

//     expect(next).toHaveBeenCalledWith(error);
//   });

//   it('refresh token이 만료된 경우', async () => {
//     (passport.authenticate as jest.Mock).mockImplementationOnce((strategy: any, options: any, callback: any) => {
//       return callback(null, null, { message: 'Some info message' });
//     });
//     (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(true);

//     await jwtAuthentication(req, res as Response, next);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: '갱신 필요' });
//   });

//   it('인증이 성공한 경우', async () => {
//     const user = { id: 'mockUserId', username: 'mockUsername' };
//     (passport.authenticate as jest.Mock).mockImplementationOnce((strategy: any, options: any, callback: any) => {
//       return callback(null, user, null);
//     });
//     (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(false);

//     await jwtAuthentication(req, res as Response, next);

//     expect(req.user).toEqual(user);
//     expect(next).toHaveBeenCalled();
//   });

//   it('인증 정보가 제공된 경우', async () => {
//     (passport.authenticate as jest.Mock).mockImplementationOnce((strategy: any, options: any, callback: any) => {
//       return callback(null, null, { message: 'Some info message' });
//     });
//     (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(false);

//     await jwtAuthentication(req, res as Response, next);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: 'accesstoken만료' });
//   });
// });




beforeAll(() => {
  // Redis 클라이언트가 이미 연결되어 있는지 확인
  if (!redisClient.connect) {
    // Redis 클라이언트가 연결되어 있지 않으면 연결 시도
    redisClient.connect();
  }
});

afterAll(() => {
  // Redis 연결 닫기
  redisClient.quit();
});
