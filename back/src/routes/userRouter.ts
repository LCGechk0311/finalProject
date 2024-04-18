import { Router } from 'express';
import {
  verifyEmail,
  emailVerified,
  userRegister,
  getMyInfo,
  getAllUser,
  getMyFriend,
  userLogout,
  getUserId,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  refresh,
  loginCallback,
  emailLink,
  testEmail,
  searchKeyword,
  sessionMyInfo,
} from '../controllers/userController';
import { jwtAuthentication } from '../middlewares/authenticateJwt';
// import { profileImageUpload } from '../middlewares/uploadMiddleware';
import { wrapAsyncController } from '../utils/wrapper';
import passport from 'passport';
import { requireAuthentication } from '../middlewares/sessionAuthorization';
const userRouter = Router();
// 회원가입
userRouter.post('/register', wrapAsyncController(userRegister));

// 이메일 인증후 회원가입
userRouter.post('/testregister', wrapAsyncController(testEmail));

// 이메일 인증
userRouter.post('/email', wrapAsyncController(emailLink));

// 이메일 인증 토큰 검증
userRouter.get('/verifyEmail/:token', wrapAsyncController(verifyEmail));

// 이메일 인증되었는지 확인
userRouter.get('/verified', emailVerified);
// 유저 키워드 검색
userRouter.get(
  '/search',
  jwtAuthentication,
  wrapAsyncController(searchKeyword),
);

// 현재 유저 정보
userRouter.get('/current', jwtAuthentication, wrapAsyncController(getMyInfo));

userRouter.get(
  '/sessionCurrent',
  requireAuthentication,
  wrapAsyncController(sessionMyInfo),
);

// 모든 유저 정보
userRouter.get('/allUser', jwtAuthentication, wrapAsyncController(getAllUser));

// 친구 유저 정보
userRouter.get(
  '/myfriend',
  jwtAuthentication,
  wrapAsyncController(getMyFriend),
);

// 로그아웃
userRouter.post(
  '/logout',
  requireAuthentication,
  wrapAsyncController(userLogout),
);

// 특정 유저 정보, 유저 수정, 유저 탈퇴
userRouter
  .route('/:userId')
  .get(jwtAuthentication, wrapAsyncController(getUserId))
  .put(jwtAuthentication, wrapAsyncController(updateUser))
  .delete(jwtAuthentication, wrapAsyncController(deleteUser));

// 비밀번호 재설정 이메일 보내기
userRouter.post('/forgot-password', wrapAsyncController(forgotPassword));

// 비밀번호 재설정
userRouter.post(
  '/reset-password',
  jwtAuthentication,
  wrapAsyncController(resetPassword),
);

// refresh token사용
userRouter.post('/refresh-token', wrapAsyncController(refresh));

// 소셜 로그인
userRouter.get(
  '/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  }),
);

// 소셜 로그인 리디렉션
userRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  loginCallback,
);

export default userRouter;
