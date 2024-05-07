import { IUser } from 'types/user';
import {
  createUser,
  myInfo,
  getAllUsers,
  getMyFriends,
  getUserInfo,
  updateUserService,
  forgotUserPassword,
  resetUserPassword,
  getUsers,
  emailLinked,
  verifyToken,
  registerUser,
  deleteUserService,
} from '../src/services/userService';

import { query } from '../src/utils/DB';
import bcrypt from 'bcrypt';
import { getMyWholeFriends } from '../src/services/friendService';
import { generateRandomPassowrd } from '../src/utils/password';
import { emailToken, sendEmail } from '../src/utils/email';

jest.mock('../src/utils/DB', () => ({
  query: jest.fn(),
}));

jest.mock('../src/services/friendService', () => ({
  getMyWholeFriends: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn(),
  emailToken: jest.fn(),
}));

jest.mock('../src/utils/password', () => ({
  generateRandomPassowrd: jest.fn(),
}));

describe('유저 생성, 업데이트, 삭제 등의 유저 CUD서비스 테스트', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('유저 생성 서비스', async () => {
    const inputData = {
      username: 'testUser',
      password: 'testpassword',
      email: 'test@example.com',
    };

    const hashedPassword: string = 'hashedPassword';
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);

    const expectedUser = {
      id: 'mockUserId',
      username: 'testUser',
      email: 'test@example.com',
    };
    (query as jest.Mock).mockResolvedValueOnce(true);
    (query as jest.Mock).mockResolvedValueOnce([expectedUser]);

    const result = await createUser(inputData as IUser);

    expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
    expect(query).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({
      id: 'mockUserId',
      username: 'testUser',
      email: 'test@example.com',
      latestEmoji: undefined,
      profile: undefined,
      profileImage: undefined,
      status: undefined,
      updatedAt: undefined,
      createdAt: undefined,
      description: undefined,
    });
    expect(result.message).toEqual('성공');
    expect(result.status).toEqual(200);
  });

  it('유저 정보 업데이트', async () => {
    const userId = 'mockUserId';
    const inputData = {
      username: 'updateUsername',
      email: 'update@test.com',
    };

    (query as jest.Mock).mockResolvedValueOnce(true);
    (query as jest.Mock).mockResolvedValueOnce([inputData]);

    const result = await updateUserService(userId, inputData);

    expect(query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      data: expect.objectContaining(inputData),
      message: '성공',
      status: 200,
    });
  });

  it('유저 관련 정보 삭제', async () => {
    const userId = 'mockUserId';

    await deleteUserService(userId);

    expect(query).toHaveBeenCalledTimes(3);
  });
});

describe('내 정보 or 특정 유저 정보 불러오기', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const userId = 'mockUserId';

  it('myInfo유저 서비스 부분', async () => {
    const expectedUser = {
      id: 'mockUserId',
      username: 'testUser',
      email: 'testEmail@test.com',
    };

    (query as jest.Mock).mockResolvedValueOnce([expectedUser]);

    const result = await myInfo(userId);

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [expectedUser],
      message: '성공',
      status: 200,
    });
  });

  it('특정 유저 정보 불러오기', async () => {
    const mockUserInfo = {
      id: 'mockUserId',
      username: 'testuser',
      email: 'test@email.com',
    };

    (query as jest.Mock).mockResolvedValueOnce(mockUserInfo);

    const result = await getUserInfo(userId);

    expect(query).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      data: expect.objectContaining(mockUserInfo),
      status: 200,
      message: '성공',
    });
  });
});

describe('유저 리스트 별 불러오기', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const page = 1;
  const limit = 10;
  const totalResult = { totalItem: 20 };
  const firstDiary = [{ emoji: '^^' }];
  const userList = [
    { id: 'userid1', username: 'user1', email: 'user1@test.com' },
    { id: 'userid2', username: 'user2', email: 'user2@test.com' },
  ];

  it('페이지네이션통한 모든 유저 리스트 불러오기', async () => {
    (query as jest.Mock).mockResolvedValueOnce(userList);
    (query as jest.Mock).mockResolvedValueOnce(firstDiary);
    (query as jest.Mock).mockResolvedValueOnce(firstDiary);
    (query as jest.Mock).mockResolvedValueOnce([totalResult]);

    const expectedResponse = {
      data: [
        {
          id: 'userid1',
          username: 'user1',
          email: 'user1@test.com',
          latestEmoji: '^^',
        },
        {
          id: 'userid2',
          username: 'user2',
          email: 'user2@test.com',
          latestEmoji: '^^',
        },
      ],
      message: '성공',
      pageInfo: {
        totalItem: 20,
        totalPage: 2,
        currentPage: 1,
        limit: 10,
      },
      status: 200,
    };

    const result = await getAllUsers(page, limit);

    expect(query).toHaveBeenCalledTimes(4);
    expect(result).toEqual(expectedResponse);
  });

  it('자신과 친구인 유저의 정보 불러오기', async () => {
    const userId = 'mockUserId';
    (getMyWholeFriends as jest.Mock).mockResolvedValueOnce([
      'userid1',
      'userid2',
    ]);

    (query as jest.Mock).mockResolvedValueOnce(userList);
    (query as jest.Mock).mockResolvedValueOnce(firstDiary);
    (query as jest.Mock).mockResolvedValueOnce(firstDiary);
    (query as jest.Mock).mockResolvedValueOnce([totalResult]);

    const result = await getMyFriends(userId, page, limit);

    const expectedResponse = {
      data: [
        {
          id: 'userid1',
          username: 'user1',
          email: 'user1@test.com',
          latestEmoji: '^^',
        },
        {
          id: 'userid2',
          username: 'user2',
          email: 'user2@test.com',
          latestEmoji: '^^',
        },
      ],
      message: '성공',
      pageInfo: {
        totalItem: 20,
        totalPage: 2,
        currentPage: 1,
        limit: 10,
      },
      status: 200,
    };

    expect(query).toHaveBeenCalledTimes(4);
    expect(result).toEqual(expectedResponse);
  });

  it('키워드에 맞는 유저 리스트 검색 성공', async () => {
    const searchTerm = 'test';
    const field = 'username';

    (query as jest.Mock).mockResolvedValueOnce(userList);
    (query as jest.Mock).mockResolvedValueOnce([totalResult]);

    const result = await getUsers(searchTerm, field, page, limit);

    expect(query).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual(expect.objectContaining(userList));
  });
});

describe('임시 비밀번호 발급 & 비밀번호 초기화', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const email = 'mock@test.com';
  it('유저 정보가 있고, 임시 비밀번호 발급이 성공했을 경우', async () => {
    const mockUser = [{ id: 'mockUserId', email }];
    const hashedPassword: string = 'hashedPassword';
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);

    (query as jest.Mock).mockResolvedValueOnce(mockUser);
    (generateRandomPassowrd as jest.Mock).mockResolvedValueOnce(true);
    (sendEmail as jest.Mock).mockResolvedValueOnce(true);

    await forgotUserPassword(email);

    expect(query).toHaveBeenCalledTimes(2);
  });

  it('유저 정보가 없을 경우', async () => {
    (query as jest.Mock).mockResolvedValueOnce([]);

    const result = await forgotUserPassword(email);

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: expect.objectContaining([]),
      message: '검색결과가 없습니다.',
      status: 204,
    });
  });

  it('유저 비밀번호 초기화 성공', async () => {
    const hashedPassword: string = 'hashedPassword';
    jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);

    await resetUserPassword(email, hashedPassword);

    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe('이메일 인증 링크 서비스 테스트', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('이메일 인증을 위한 링크를 관련 유저 이메일에 보내는 부분', async () => {
    const email = 'test@email.com';
    const result = { token: 'mockToken', expires: 'mockExpires' };
    process.env.NODE_ENV = 'development';

    (emailToken as jest.Mock).mockResolvedValueOnce(result);

    await emailLinked(email);

    expect(query).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('사용자의 이메일 인증 링크 식별 성공', async () => {
    const userId = 'mockUserId';

    await verifyToken(userId);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('이메일 인증 후 나머지 사용자 등록 정보 입력', async () => {
    const userId = 'mockUserId';
    const username = 'mockUsername';
    const password = 'testpassword';
    const updatedUser = {
        id: userId,
        username,
    };

    (query as jest.Mock).mockResolvedValueOnce(true);
    (query as jest.Mock).mockResolvedValueOnce([updatedUser]);

    const result = await registerUser(userId, username, password);

    expect(query).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expect.objectContaining({
        data: updatedUser,
        status: 200,
        message: '성공'
    }))
  });
});