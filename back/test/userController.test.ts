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
  getAllUser,
  getMyFriend
} from '../src/controllers/userController';
// import {
//   createUser,
//   myInfo,
//   getUserInfo,
//   deleteUserService,
//   forgotUserPassword,
//   resetUserPassword,
//   updateUserService,
//   getUsers,
//   verifyToken,
//   registerUser,
//   getAllUsers,
//   getMyFriends
// } from '../src/services/userService';
import * as userService from '../src/services/userService';
import { Request, NextFunction } from 'express';
import { IRequest } from 'types/request';
import { query } from '../src/utils/DB';

let req: any = {};
let res: any = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
let next: NextFunction = jest.fn();

// jest.mock('../src/services/userService', () => ({
//   myInfo: jest.fn(),
//   createUser: jest.fn(),
//   getUserInfo: jest.fn(),
//   deleteUserService: jest.fn(),
//   forgotUserPassword: jest.fn(),
//   resetUserPassword: jest.fn(),
//   updateUserService: jest.fn(),
//   getUsers: jest.fn(),
//   registerUser: jest.fn(),
//   verifyToken: jest.fn(),
//   getAllUsers: jest.fn(),
//   getMyFriends: jest.fn().mockResolvedValue({
//     status: 200,
//     data: ['friend1', 'friend2'],
//   }),
// }));
jest.mock('../src/services/userService');

jest.mock('../src/utils/DB', () => ({
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

    (userService.createUser as jest.Mock).mockResolvedValueOnce(mockCreateInfo);

    await userRegister(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCreateInfo);
  });

  it('조건에 부합하지 않았을시', async () => {
    const req: Partial<Request> = {
      body: {
        email: 'mockuser@example.com',
        password: 'password',
      },
    };

    await userRegister(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: '양식에 맞춰서 입력해주세요',
    });
  });

  it('유저 정보 수정 성공', async () => {
    const req: Partial<Request> = {
      params: { userId: 'mockUser' },
      body: {
        description: 'hihi',
        username: 'lee',
      },
    };

    const mockUpdateInfo = {
      data: [
        {
          id: 'mockUserId',
          username: 'lee',
          email: 'mockuser@example.com',
          description: 'hihi',
          createdAt: '2024-03-07T06:47:00.809Z',
          updatedAt: '2024-03-07T06:47:00.809Z',
          isFriend: 0,
          latestEmoji: 'null',
        },
      ],
      message: '성공',
      status: 200,
    };

    (userService.updateUserService as jest.Mock).mockResolvedValueOnce(mockUpdateInfo);

    await updateUser(req as IRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUpdateInfo);
  });
});

describe('유저 정보', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUserInfo = {
    data: [
      {
        id: 'mockUserId',
        username: 'mockusername',
        email: 'mock@gmail.com',
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

  it('myinfo 서비스 부분 테스트', async () => {
    const req: any = { user: { id: 'mockUserId' } };

    (userService.myInfo as jest.Mock).mockResolvedValueOnce(mockUserInfo);

    await getMyInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUserInfo);
  });

  it('특정 유저 정보 부분 테스트', async () => {
    const req: any = { params: { userId: 'mockUserId' } };

    (userService.getUserInfo as jest.Mock).mockResolvedValueOnce(mockUserInfo);

    await getUserId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUserInfo);
  });

  it('유저 키워드 검색', async () => {
    const req: any = { query: { searchTerm: '이', field: 'username' } };

    const mockSearchInfo = {
      data: [
        {
          id: 'mockUserId',
          username: '이씨',
          email: 'mockuser@example.com',
          description: 'null',
          createdAt: '2024-03-07T06:47:00.809Z',
          updatedAt: '2024-03-07T06:47:00.809Z',
          latestEmoji: 'null',
        },
      ],
      message: '성공',
      status: 200,
      pageInfo: {
        totalItem: 1,
        totalPage: 1,
        currentPage: 1,
        limit: 10,
      },
    };

    (userService.getUsers as jest.Mock).mockResolvedValueOnce(mockSearchInfo);

    await searchKeyword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockSearchInfo);
  });
});

describe('delete user', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('유저 삭제 성공', async () => {
    const req: any = {
      user: { id: 'mockUserId' },
      params: { userId: 'mockUserId' },
    };
    (userService.deleteUserService as jest.Mock).mockResolvedValueOnce(true);

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '사용자가 삭제되었습니다.',
    });
  });

  it('삭제 유저 & 로그인된 유저 불일치', async () => {
    const req: any = {
      user: { id: 'mockLoginUserId' },
      params: { userId: 'mockUserId' },
    };

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: '권한이 없습니다.' });
  });
});

describe('비밀번호 관련', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('해당 이메일 계정이 없을 경우', async () => {
    const req = { body: { email: 'nonexistent@example.com' } };

    (query as jest.Mock).mockResolvedValueOnce([]);

    await forgotPassword(req as IRequest, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).toHaveBeenCalledWith({
      message: '검색결과가 없습니다.',
    });
  });

  it('임시 비밀번호 발급 성공', async () => {
    const req: any = {
      body: { email: 'mockUser@test.com' },
    };

    (query as jest.Mock).mockResolvedValueOnce(true);
    (userService.forgotUserPassword as jest.Mock).mockResolvedValueOnce(true);

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '임시 비밀번호가 이메일로 전송되었습니다.',
    });
  });

  it('비밀번호 재설정', async () => {
    const req: any = {
      body: { email: 'mockUser@test.com', password: '1111' },
    };

    (userService.resetUserPassword as jest.Mock).mockResolvedValueOnce(true);

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '비밀번호가 재설정되었습니다.',
    });
  });
});

describe('이메일 인증', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('이메일 토큰 인증 성공', async () => {
    const req: any = {
      params: 'emailToken',
    };
    const res: any = {
      redirect: jest.fn(),
    };
    (query as jest.Mock).mockResolvedValueOnce(true);
    (userService.verifyToken as jest.Mock).mockResolvedValueOnce(true);

    await verifyEmail(req, res);

    expect(res.redirect).toHaveBeenCalled();
  });

  it('이메일 토큰 인증 실패', async () => {
    const req: any = {
      params: 'emailToken',
    };
    (query as jest.Mock).mockResolvedValueOnce(false);

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: '토큰이 유효하지 않습니다.',
    });
  });

  it('이메일 인증 후 회원가입', async () => {
    const req: any = {
      body: {
        email: 'mockUser@test.com',
        username: 'mockUser',
        password: '1111',
      },
    };

    (query as jest.Mock).mockResolvedValueOnce(true);
    (userService.registerUser as jest.Mock).mockResolvedValueOnce(true);

    await testEmail(req, res);
  });

  it('등록된 이메일이 아닐 경우', async () => {
    const req: any = {
      body: {
        email: 'mockUser@test.com',
        username: 'mockUser',
        password: '1111',
      },
    };

    (query as jest.Mock).mockResolvedValueOnce(false);

    await testEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: '이메일 인증이 필요합니다.',
    });
  });
});

describe('getAllUser', () => { 
  const mockUser = { id: 'mockUserId' };
  const mockUsersData = {
    status: 200,
    data: [
      { id: 'mockUserId1', name: 'User 1' },
      { id: 'mockUserId2', name: 'User 2' },
    ],
  };

  beforeEach(() => {
    req = {
      query: { page: '1', limit: '10' },
      user: mockUser,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('모든 유저 불러오기 성공!', async () => {
    (userService.getAllUsers as jest.Mock).mockResolvedValueOnce(mockUsersData);

    await getAllUser(req as IRequest, res);

    expect(userService.getAllUsers).toHaveBeenCalledWith(1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsersData);
  });
});

describe('getMyFriend', () => {
  const mockUser = { id: 'mockUserId' };
  const mockUsersData = {
    status: 200,
    data: [
      { id: 'mockUserId1', name: 'User 1' },
      { id: 'mockUserId2', name: 'User 2' },
    ],
  };
  beforeEach(() => {
    req = {
      query: { page: '1', limit: '10' },
      user: mockUser,
    };
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('인증된 유저의 친구리스트 뽑아오기 ', async () => {
    (userService.getMyFriends as jest.Mock).mockResolvedValueOnce(mockUsersData);

    await getMyFriend(req as IRequest, res);

    expect(userService.getMyFriends).toHaveBeenCalledWith("mockUserId", 1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});