import { Request, Response } from 'express';
import {
  createUser,
  myInfo,
  getAllUsers,
  getMyFriends,
  logout,
  getUserInfo,
  updateUserService,
  deleteUserService,
  forgotUserPassword,
  resetUserPassword,
  getUsers,
  emailLinked,
  verifyToken,
  registerUser,
} from '../services/userService';
import { generateAccessToken, verifyRefreshToken } from '../utils/tokenUtils';
import { IRequest } from 'types/request';
import { userUpdateValidateDTO, userValidateDTO } from '../dtos/userDTO';
import { plainToClass } from 'class-transformer';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { generateRefreshToken } from '../utils/tokenUtils';
import { generateError } from '../utils/errorGenerator';
import { validate } from 'class-validator';
import { setCookie } from '../utils/responseData';
import { query } from '../utils/DB';

export const userRegister = async (req: Request, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '회원가입'
  const { username, email, password, permissions } = req.body;

  const userInput = plainToClass(userValidateDTO, req.body);

  const errors = await validate(userInput);

  if (errors.length > 0) {
    // throw generateError(500, '양식에 맞춰서 입력해주세요');
    return res.status(500).json({ message: '양식에 맞춰서 입력해주세요' });
  }

  // createUser 함수를 사용하여 새 사용자 생성
  const user = await createUser(req.body);

  return res.status(200).json(user);
};

export const getMyInfo = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '현재 유저 정보'
        */

  const userId = req.user.id;
  const currentUserInfo = await myInfo(userId);

  res.status(currentUserInfo.status).json(currentUserInfo);
};

export const sessionMyInfo = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '현재 유저 정보'
        */

  const userId = req.session.userId;
  const currentUserInfo = await myInfo(userId);

  res.status(currentUserInfo.status).json(currentUserInfo);
};

export const getAllUser = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  //     #swagger.security = [{
  //         "bearerAuth": []
  //  }]
  // #swagger.summary = '모든 유저 정보'

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const userId = req.user.id;

  const allUsers = await getAllUsers(page, limit);

  return res.status(allUsers.status).json(allUsers);
};

export const getMyFriend = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '친구 유저 정보'
        */

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const userId = req.user.id;

  const allMyFriends = await getMyFriends(userId, page, limit);

  return res.status(allMyFriends.status).json(allMyFriends);
};

export const userLogout = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '로그아웃'
        */
  const sessionId = req.sessionID;

  await logout(sessionId);

  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    res.clearCookie('sessionID');
    return res.status(204).json({ message: '로그아웃 완료' });
  });
};

export const getUserId = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '특정 유저 정보'
        */

  const userId = req.params.userId;

  // getUserInfo 함수를 사용하여 특정 사용자의 정보 가져오기
  const userInfo = await getUserInfo(userId);

  res.status(userInfo.status).json(userInfo);
};

export const updateUser = async (req: IRequest, res: Response) => {
  // swagger 데이터전용
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '유저 정보 수정'
        */

  const { email, username, description } = req.body;

  const userId = req.params.userId;
  const userInput = plainToClass(userUpdateValidateDTO, req.body);

  const errors = await validate(userInput);

  if (errors.length > 0) {
    // throw generateError(500, '양식에 맞춰서 입력해주세요');
    return res.status(500).json({ message: '양식에 맞춰서 입력해주세요' });
  }
  // updateUserService 함수를 사용하여 사용자 정보 업데이트
  const updatedUser = await updateUserService(userId, req.body);

  res.status(updatedUser.status).json(updatedUser);
};

export const deleteUser = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '유저 탈퇴'
        */

  const loginId = req.user.id;
  const userIdToDelete = req.params.userId;

  if (loginId !== userIdToDelete) {
    return res.status(403).json({ message: '권한이 없습니다.' });
  }

  // deleteUserService 함수를 사용하여 사용자 삭제
  await deleteUserService(userIdToDelete);

  res.status(200).json({ message: '사용자가 삭제되었습니다.' });
};

export const forgotPassword = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '임시 비밀번호 발급'

  const { email } = req.body;

  const userQuery = `SELECT * FROM user WHERE email = ?`;
  const user = await query(userQuery, [email]);

  if (user.length === 0) {
    const response = emptyApiResponseDTO();
    return res.status(response.status).json({ message: response.message });
  }

  await forgotUserPassword(email);

  return res
    .status(200)
    .json({ message: '임시 비밀번호가 이메일로 전송되었습니다.' });
};

export const resetPassword = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '비밀번호 초기화'
        */
  const { email, password } = req.body;

  // resetUserPassword 함수를 사용하여 비밀번호 재설정
  await resetUserPassword(email, password);

  return res.status(200).json({ message: '비밀번호가 재설정되었습니다.' });
};

export const refresh = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '리프레시 토큰'

  // const refreshToken = req.body.token;

  const cookiesArray = req.headers.cookie.split('; ');

  let refreshToken;
  cookiesArray.forEach((cookie) => {
    const [name, value] = cookie.split('=');
    if (name === 'newRefreshToken') {
      refreshToken = value;
    }
  });

  if (!refreshToken) {
    const response = emptyApiResponseDTO();
    return response;
  }
  // Refresh Token을 사용하여 사용자 ID 확인
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    throw generateError(403, 'refreshToken이 유효하지않음');
  }

  // accessToken 재발급
  const accessToken = generateAccessToken(userId);
  // refreshToken 재발급
  const newRefreshToken = await generateRefreshToken(userId);

  // accessToken 쿠키 설정
  setCookie(res, 'accessToken', accessToken.token, accessToken.expiresAt);

  // newRefreshToken 쿠키 설정
  setCookie(
    res,
    'newRefreshToken',
    newRefreshToken.token,
    newRefreshToken.expireIn,
  );

  res.json({ message: '성공' });
};

export const loginCallback = (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '소셜 로그인 성공 시 홈 페이지로 리다이렉션'

  // 소셜 로그인 성공 시 홈 페이지로 리다이렉션
  res.redirect('/');
};

export const searchKeyword = async (req: IRequest, res: Response) => {
  /* #swagger.tags = ['Users']
         #swagger.security = [{
               "bearerAuth": []
        }]
     #swagger.summary = '키워드에 맞는 유저 정보 검색'
        */

  const searchTerm = req.query.searchTerm as string;
  const field = req.query.field as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!field || (field !== 'username' && field !== 'email')) {
    return res.status(500).json({ message: '올바른 필드 값을 지정하세요.' });
  }

  const searchKeyword = await getUsers(searchTerm, field, page, limit);

  return res.status(searchKeyword.status).json(searchKeyword);
};

// 선 이메일 인증 요청
export const emailLink = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '회원가입 전 이메일 인증'

  const { email } = req.body;

  await emailLinked(email);

  res.json({ message: '이메일을 확인해주세요' });
};

// 이메일인증 확인
export const verifyEmail = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '이메일 인증 토큰 확인'

  const { token } = req.params;

  const sqlQuery = `
    SELECT * FROM user 
    WHERE verificationToken = ? 
    AND verificationTokenExpires >= NOW()
    LIMIT 1;
  `;

  const user = await query(sqlQuery, [token]);
  if (!user) {
    return res.status(404).json({ message: '토큰이 유효하지 않습니다.' });
  }

  await verifyToken(token);

  res.redirect('/api/users/verified');
};

export const emailVerified = (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '이메일 인증 확인'

  res.send('이메일이 성공적으로 인증되었습니다.');
};

// 이메일 인증 후 회원가입
export const testEmail = async (req: IRequest, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = '이메일 인증 후 회원가입'

  const { email, username, password } = req.body;

  const userQuery = 'SELECT id, isVerified FROM user WHERE email = ?';

  const user = await query(userQuery, [email]);

  if (!user) {
    return res.status(404).json({ message: '이메일 인증이 필요합니다.' });
  }

  const userRegister = await registerUser(email, username, password);

  return res.status(userRegister.status).json(userRegister);
};
