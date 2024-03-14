import { userRegister, getMyInfo } from '../../controllers/userController';
import { Request, Response, NextFunction } from 'express';
import { IRequest } from 'types/request';
import redisClient from '../../utils/DB';

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req: any = {};
const res: any = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
const next: any = jest.fn();

// // describe('userRegister', () => {
// //   it('create user successfully', async () => {
// //     const req: Partial<Request> = {
// //       body: {
// //         username: 'test131user',
// //         email: 'test31678@example.com',
// //         password: 'password',
// //       },
// //     };

// //     await userRegister(req as Request, res);

// //     expect(res.status).toBeCalledWith(200);
// //   });
// // });

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
