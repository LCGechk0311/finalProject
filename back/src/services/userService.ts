import { Prisma } from '@prisma/client';
import { generateRandomPassowrd } from '../utils/password';
import bcrypt from 'bcrypt';
import { plainToClass } from 'class-transformer';
import { userResponseDTO } from '../dtos/userDTO';
import { successApiResponseDTO } from '../utils/successResult';
import { calculatePageInfo } from '../utils/pageInfo';
import { PaginationResponseDTO } from '../dtos/diaryDTO';
import { emailToken, sendEmail } from '../utils/email';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { IUser } from 'types/user';

// prisma대체
import { prisma } from '../../prisma/prismaClient';
import { query, execute } from '../utils/DB';

import redisClient from '../utils/DB';

export const createUser = async (inputData: IUser) => {
  const { username, password, email } = inputData;

  // 비밀번호를 해시하여 저장 (안전한 비밀번호 저장)
  const hashedPassword = await bcrypt.hash(password, 10);
  const sqlQuery = `
    INSERT INTO user (id, username, password, email)
    VALUES (UUID(), ?, ?, ?);
  `;
  // const result = await query(sqlQuery, [username, hashedPassword, email]);

  const result = await execute(sqlQuery, [username, hashedPassword, email]);

  console.log(result);

  const userId = result.insertId;
  const selectQuery = `
    SELECT * FROM user WHERE id = ?;
  `;

  // const selectResult = await query(selectQuery, [userId]);

  // const insertedUser = selectResult[0];

  const [insertedUser] = await execute(selectQuery, [userId]);
  console.log([insertedUser]);

  const UserResponseDTO = plainToClass(userResponseDTO, insertedUser, {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(UserResponseDTO);
  return response;
};

export const myInfo = async (userId: string) => {

  const sqlQuery = `
      SELECT * FROM user
      WHERE id = ?;
    `;

  // 쿼리 실행을 비동기적으로 수행하기 위해 util.promisify를 사용
  const results = await query(sqlQuery, [userId]);

  const UserResponseDTO = plainToClass(userResponseDTO, results, {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(UserResponseDTO);
  return response;
};

export const getAllUsers = async (
  userId: string,
  page: number,
  limit: number,
) => {
  // const friendList = await getMyWholeFriends(userId);

  // const friendIds = friendList.map((friend) => {
  //   return userId == friend.sentUserId
  //     ? friend.receivedUserId
  //     : friend.sentUserId;
  // });

  const sqlQuery = `
  SELECT
    CASE
      WHEN sentUserId = ? THEN receivedUserId
      ELSE sentUserId
    END AS friendId
  FROM Friend
  WHERE (sentUserId = ? OR receivedUserId = ?) AND status = true
`;

  const rows = await query(sqlQuery, [userId, userId, userId]);

  const friendIds = rows.map((row: { friendId: string }) => row.friendId);

  const userQuery = `
  SELECT user.*, profileImage.*
  FROM User AS user
  LEFT JOIN fileUpload AS profileImage ON user.id = profileImage.userId
  LIMIT ${limit}
  OFFSET ${(page - 1) * limit};
`;

  const userList = await query(userQuery);

  for (const user of userList) {
    const diaryQuery = `
    SELECT *
    FROM Diary
    WHERE authorId = ${user.id}
    ORDER BY createdDate ASC
    LIMIT 1;
  `;

    const [firstDiary] = await query(diaryQuery);

    if (firstDiary) {
      user.latestEmoji = firstDiary.emoji;
    }
  }

  friendIds.push(userId);
  const friendsWithIsFriend = userList.map((user: IUser) => {
    user.isFriend = friendIds.includes(user.id);
    return user;
  });

  const { totalItem, totalPage } = await calculatePageInfo('user', limit, {});

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const userResponseDataList = friendsWithIsFriend.map(
    (user: { userId: string }) =>
      plainToClass(userResponseDTO, user, { excludeExtraneousValues: true }),
  );

  const response = new PaginationResponseDTO(
    200,
    userResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

export const getMyFriends = async (
  userId: string,
  page: number,
  limit: number,
) => {
  // const friendList = await getMyWholeFriends(userId);

  // const friendIds = friendList.map((friend) => {
  //   return userId == friend.sentUserId
  //     ? friend.receivedUserId
  //     : friend.sentUserId;
  // });

  const sqlQuery = `
  SELECT
    CASE
      WHEN sentUserId = ? THEN receivedUserId
      ELSE sentUserId
    END AS friendId
  FROM Friend
  WHERE (sentUserId = ? OR receivedUserId = ?) AND status = true
`;

  const rows = await query(sqlQuery, [userId, userId, userId]);

  const friendIds = rows.map((row: { friendId: string }) => row.friendId);

  const friendsInfo = await prisma.user.findMany({
    take: limit,
    skip: (page - 1) * limit,
    where: {
      id: {
        in: friendIds, // 친구의 ID 목록
      },
    },
    include: {
      profileImage: true,
    },
  });

  const friendQuery = `
  SELECT user.*, profileImage.*
  FROM User AS user
  LEFT JOIN fileUpload AS profileImage ON user.id = profileImage.userId
  ${friendIds.length > 0 ? `WHERE user.id IN (${friendIds.join(', ')})` : ''}
  LIMIT ${limit}
  OFFSET ${(page - 1) * limit};
`;

  const friendList = await query(friendQuery);

  for (const friend of friendList) {
    const diaryQuery = `
    SELECT *
    FROM Diary
    WHERE authorId = ${friend.id}
    ORDER BY createdDate ASC
    LIMIT 1;
  `;

    const [firstDiary] = await query(diaryQuery);

    if (firstDiary) {
      friend.latestEmoji = firstDiary.emoji;
    }
  }

  const friendsWithIsFriend = friendsInfo.map((friend) => {
    friend.isFriend = true; // 또는 false
    return friend;
  });

  const totalItem = friendsWithIsFriend.length;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const userResponseDataList = friendsWithIsFriend.map((user) =>
    plainToClass(userResponseDTO, user, { excludeExtraneousValues: true }),
  );

  const response = new PaginationResponseDTO(
    200,
    userResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

const getFromCache = async (userId: string) => {
  return new Promise<any>((resolve, reject) => {
    // redisClient.get(userId, (err: Error | null, data: string | null) => {
    //   if (err) {
    //     reject(err);
    //   } else {
    //     resolve(data ? JSON.parse(data) : null);
    //   }
    // });
  });
};

const setToCache = async (userId: string, userInfo: any, ttl: number) => {
  redisClient.setEx(userId, ttl, JSON.stringify(userInfo));
};

export const getUserInfo = async (userId: string) => {
  const cachedUserInfo = await getFromCache(userId);
  if (cachedUserInfo) {
    return cachedUserInfo;
  }

  const sqlQuery = `
    SELECT user.*, fileUpload.*
    FROM user
    LEFT JOIN fileUpload ON user.id = fileUpload.userId
    WHERE user.id = '${userId}';
  `;

  const userInfo = await query(sqlQuery);
  const response = successApiResponseDTO(userInfo);

  await setToCache(userId, response, 3600);
  return response;
};

export const logout = async (userId: string) => {
  const sqlQuery = `
    DELETE FROM refreshToken
    WHERE userId = '${userId}';
  `;

  await query(sqlQuery);
};

export const updateUserService = async (
  userId: string,
  inputData: Prisma.UserUpdateInput,
) => {
  if (inputData.password) {
    delete inputData.password; // 비밀번호는 여기서 업데이트하지 않음
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: inputData,
    include: {
      profileImage: {
        select: {
          url: true, // url 필드만 선택
        },
      },
    },
  });

  // const sqlQuery = `
  //   UPDATE user
  //   SET ${Object.keys(inputData).map(key => `${key} = '${inputData[key]}'`).join(', ')}
  //   WHERE id = '${userId}';
  // `;

  // const [updatedUser] = await query(sqlQuery);
  const UserResponseDTO = plainToClass(userResponseDTO, updatedUser, {
    excludeExtraneousValues: true,
  });
  const response = successApiResponseDTO(UserResponseDTO);
  return response;
};

export const deleteUserService = async (userId: string) => {
  const user = await query(
    `
    SELECT * FROM user
    WHERE id = ?
  `,
    [userId],
  );

  if (!user || user.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  await query(
    `
    DELETE FROM refreshToken
    WHERE userId = ?
    `,
    [userId],
  );

  await query(
    `
    DELETE FROM friend
    WHERE sentUserId = ? OR receivedUserId = ?
    `,
    [userId, userId],
  );

  await query(
    `
    DELETE FROM diary
    WHERE authorId = ?
    `,
    [userId],
  );

  await query(
    `
    DELETE FROM user
    WHERE id = ?
    `,
    [userId],
  );
};

export const forgotUserPassword = async (email: string) => {
  const userQuery = `SELECT * FROM user WHERE email = ?`;
  const user = await query(userQuery, [email]);

  if (user.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  // 임시 비밀번호 생성
  const tempPassword = generateRandomPassowrd();
  const saltRounds = 10;

  // 임시 비밀번호를 해시하여 저장
  const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

  const updatePasswordQuery = `UPDATE user SET password = ? WHERE email = ?`;
  await query(updatePasswordQuery, [hashedPassword, email]);

  // 사용자에게 임시 비밀번호를 이메일로 전송
  await sendEmail(
    email,
    '비밀번호 재설정',
    `임시 비밀번호 : ${tempPassword}`,
    ``,
  );
};

export const resetUserPassword = async (email: string, password: string) => {
  // 데이터베이스에서 사용자 이메일로 사용자 조회
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const saltRounds = 10;

  // 새로운 비밀번호를 해시하여 저장
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const updatePasswordQuery = `UPDATE user SET password = ? WHERE email = ?`;
  await query(updatePasswordQuery, [hashedPassword, email]);
};

export const getUserFromDatabase = async (userId: string) => {

  const sqlQuery = 'SELECT id, username, email FROM user WHERE id = ?';

  const user = await query(sqlQuery, [userId]);
  return user;
};

export const getUsers = async (
  searchTerm: string,
  field: string,
  page: number,
  limit: number,
) => {
  if (!field || (field !== 'username' && field !== 'email')) {
    throw { error: '올바른 필드 값을 지정하세요.' };
  }

  let whereCondition = '';
  let params: any = [];

  if (field === 'username') {
    whereCondition = 'username LIKE ?';
    params = [`%${searchTerm}%`];
  } else if (field === 'email') {
    whereCondition = 'email LIKE ?';
    params = [`%${searchTerm}%`];
  }

  const offset = (page - 1) * limit;

  const sqlQuery = `
    SELECT * FROM user
    WHERE ${whereCondition}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) FROM user
    WHERE ${whereCondition}
  `;

  const result = await query(sqlQuery, [...params, limit, offset]);
  const countResult = await query(countQuery, params);

  const totalItem = parseInt(countResult.count, 10);
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const userResponseDataList = result.map((user: IUser) =>
    plainToClass(userResponseDTO, user, { excludeExtraneousValues: true }),
  );

  const response = new PaginationResponseDTO(
    200,
    userResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

export const emailLinked = async (email: string) => {

  const result = emailToken();

  const sqlQuery = `
    INSERT INTO user (id, email, isVerified,verificationToken, verificationTokenExpires)
    VALUES (UUID(), ?, false, ?, ?);
  `;

  const user = await query(sqlQuery, [email, result.token, result.expires]);

  let baseUrl;
  if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://localhost:5001';
  } else {
    baseUrl = 'https://kdt-ai-8-team02.elicecoding.com';
  }
  const verifyUrl = `${baseUrl}/api/users/verifyEmail/${result.token}`;

  await sendEmail(
    email,
    '이메일 인증',
    '',
    `<p>눌러 주세요</p>
        <p><a href = "${verifyUrl}">Verify Email</a></p>
        <p>${result.expires}</p>`,
  );
};

export const verifyToken = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpires: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    throw { message: '토큰이 유효하지 않습니다.' };
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });
};

export const registerUser = async (
  email: string,
  username: string,
  password: string,
) => {

  const userQuery = 'SELECT id, isVerified FROM user WHERE email = ?';

  const [user] = await query(userQuery, [email]);

  if (!user || !user.isVerified) {
    throw { message: '이메일 인증이 필요합니다.' };
  }

  // 비밀번호를 해시하여 저장 (안전한 비밀번호 저장)
  const hashedPassword = await bcrypt.hash(password, 10);

  const updateUserQuery = `UPDATE user SET username = ?, password = ? WHERE id = ?`;

  await query(updateUserQuery, [username, hashedPassword, user.id]);

  const updatedUserQuery = 'SELECT * FROM user WHERE id = ?';

  const [updatedUser] = await query(updatedUserQuery, [user.id]);

  const UserResponseDTO = plainToClass(userResponseDTO, updatedUser[0], {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(UserResponseDTO);
  return response;
};