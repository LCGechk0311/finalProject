import {
  userRegister,
  getMyInfo,
  getUserId,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUser,
  searchKeyword,
  testEmail,
  verifyEmail,
} from '../../controllers/userController';
import {
  createUser,
  myInfo,
  getUserInfo,
  deleteUserService,
  forgotUserPassword,
  resetUserPassword,
  updateUserService,
  getUsers,
  verifyToken,
  registerUser,
} from '../../services/userService';
import { Request, NextFunction } from 'express';
import { IRequest } from 'types/request';
import redisClient, { query } from '../../utils/DB';

const req: any = {};
const res: any = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
const next: NextFunction = jest.fn();

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

jest.mock('../../services/userService', () => ({
  myInfo: jest.fn(),
  createUser: jest.fn(),
  getUserInfo: jest.fn(),
  deleteUserService: jest.fn(),
  forgotUserPassword: jest.fn(),
  resetUserPassword: jest.fn(),
  updateUserService: jest.fn(),
  getUsers: jest.fn(),
  registerUser: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock('../../utils/DB', () => ({
  query: jest.fn(),
}));

describe('유저 CUD', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create user successfully', async () => {
    const req: Partial<Request> = {
      body: {
        username: 'mockusername',
        email: 'mockuser@example.com',
        password: 'password',
      },
    };

    const mockCreateInfo = {
      data: [
        {
          id: 'mockUserId',
          username: 'mockusername',
          email: 'mockuser@example.com',
          description: 'null',
          createdAt: '2024-03-07T06:47:00.809Z',
          updatedAt: '2024-03-07T06:47:00.809Z',
          isFriend: 0,
          latestEmoji: 'null',
        },
      ],
      message: '성공',
      status: 200,
    };

    (createUser as jest.Mock).mockResolvedValueOnce(mockCreateInfo);

    await userRegister(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCreateInfo);
  });
});