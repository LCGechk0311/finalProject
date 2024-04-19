// import { jwtAuthentication } from '../src/middlewares/authenticateJwt';
// import passport from 'passport';
// import { Request, Response, NextFunction } from 'express';
// import { IRequest } from 'types/request';
// import {
//   verifyRefreshToken,
//   generateAccessToken,
//   generateRefreshToken,
// } from '../src/utils/tokenUtils';
// import { localAuthentication } from '../src/middlewares/authenticateLocal';
// import { IUser } from 'types/user';
// import { setCookie } from '../src/utils/responseData';
// import googleStrategy from '../src/config/passport/googleStrategy';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { loginCallback } from '../src/controllers/userController';
// import redisClient, { query }  from '../src/utils/DB';

// const req: any = {};
// const res: any = {
//   status: jest.fn().mockReturnThis(),
//   json: jest.fn(),
// };
// const next: NextFunction = jest.fn();

// jest.mock('passport', () => ({
//   user: jest.fn(),
//   authenticate: jest.fn(),
// }));

// jest.mock('dotenv', () => ({
//   config: jest.fn(),
// }));

// jest.mock('../src/utils/DB', () => ({
//   query: jest.fn(),
// }));

// jest.mock('../src/utils/tokenUtils', () => ({
//   verifyRefreshToken: jest.fn(),
//   generateAccessToken: jest.fn(),
//   generateRefreshToken: jest.fn(),
// }));

// jest.mock('../src/utils/responseData', () => ({
//   setCookie: jest.fn(),
// }));

// describe('jwtAuthentication', () => {
//   const req: any = { cookies: { newRefreshToken: 'mockRefreshToken' } };

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('Passport 모듈의 authenticate 함수가 에러를 반환', async () => {
//     const error = new Error('Authentication error');
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(error, null, null);
//       },
//     );

//     await jwtAuthentication(req, res, next);

//     expect(next).toHaveBeenCalledWith(error);
//   });

//   it('access token만 만료된 경우', async () => {
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(null, null, { message: 'Some info message' });
//       },
//     );
//     (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(true);

//     await jwtAuthentication(req as IRequest, res, next);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: '갱신 필요' });
//   });

//   it('인증이 성공한 경우', async () => {
//     const user = { id: 'mockUserId', username: 'mockUsername' };
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(null, user, null);
//       },
//     );

//     await jwtAuthentication(req, res, next);

//     expect(req.user).toEqual(user);
//     expect(next).toHaveBeenCalled();
//   });

//   it('accesstoken, refreshtoken만료', async () => {
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(null, null, { message: 'Some info message' });
//       },
//     );
//     (verifyRefreshToken as jest.Mock).mockResolvedValueOnce(false);

//     await jwtAuthentication(req as IRequest, res, next);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.json).toHaveBeenCalledWith({ message: 'refreshToken만료' });
//   });
// });

// describe('localAuthentication', () => {
//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('Passport 모듈의 authenticate 함수가 에러를 반환', async () => {
//     const error = new Error('Authentication error');
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(error, null, null);
//       },
//     );

//     await jwtAuthentication(req, res, next);

//     expect(next).toHaveBeenCalledWith(error);
//   });

//   it('사용자의 정보가 없을 경우', () => {
//     const info = {
//       status: 404,
//       message: '사용자를 찾을 수 없습니다.',
//     };
//     const user: IUser = null; // 사용자 아이디 불일치
//     const error: Error = null;
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         callback(error, user, info);
//       },
//     );

//     localAuthentication(req as IRequest, res, next);

//     expect(passport.authenticate).toHaveBeenCalled();
//     expect(next).toHaveBeenCalledWith(info);
//   });

//   it('비밀번호가 불일치하는 경우', () => {
//     const info = {
//       status: 403,
//       message: '비밀번호가 일치하지 않습니다. ',
//     };
//     const user: IUser = null; // 비밀번호 불일치
//     const error: Error = null;
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         callback(error, user, info);
//       },
//     );

//     localAuthentication(req as IRequest, res, next);

//     expect(passport.authenticate).toHaveBeenCalled();
//     expect(next).toHaveBeenCalledWith(info);
//   });

//   it('유저 정보', () => {
//     const user = {
//       email: 'mock@email.com',
//       username: 'mockUsername',
//       password: '1111',
//     };
//     (passport.authenticate as jest.Mock).mockImplementationOnce(
//       (strategy: any, options: any, callback: any) => {
//         return callback(null, user, null);
//       },
//     );

//     (generateAccessToken as jest.Mock).mockResolvedValueOnce(true);
//     (generateRefreshToken as jest.Mock).mockResolvedValueOnce(true);
//     (setCookie as jest.Mock).mockResolvedValueOnce(true);

//     localAuthentication(req, res, next);

//     expect(req.user).toEqual(user);
//     expect(next).toHaveBeenCalled();
//   });
// });

// // describe('구글 소셜 로그인', () => {
// //   afterEach(() => {
// //     jest.clearAllMocks();
// //   });

// //   it('로그인 요청 성공 시', async () => {
// //     // 로그인 콜백 요청을 시뮬레이션
// //     const req = {};
// //     const res: any = {
// //       redirect: jest.fn(),
// //       status: jest.fn(),
// //       json: jest.fn(),
// //     };

// //     // 로그인 콜백을 호출
// //     loginCallback(req as IRequest, res);

// //     // 로그인 성공 후 홈페이지로 리다이렉션 되는지 확인
// //     expect(res.redirect).toHaveBeenCalledWith('/');
// //   });

//   // it('인증 성공', () => {
//   //   const mockedGoogleStrategy = new GoogleStrategy(
//   //     {
//   //       clientID: 'mockedClientId',
//   //       clientSecret: 'mockedClientSecret',
//   //       callbackURL: '/api/users/google/callback',
//   //     },
//   //     jest.fn(),
//   //   );

//   //   (passport.use as jest.Mock).mockImplementationOnce((strategyName, options) => {
//   //     expect(strategyName).toBe('google');
//   //     expect(options.scope).toEqual([
//   //       'https://www.googleapis.com/auth/userinfo.email',
//   //       'https://www.googleapis.com/auth/userinfo.profile',
//   //     ]);
//   //     options.callback('mockedAccessToken', 'mockedRefreshToken', {}, () => {});
//   //   });

//   //   passport.use(mockedGoogleStrategy);

//   //   expect(passport.authenticate).toHaveBeenCalled();
//   // });

//   // it('등록된 사용자가 있는 경우', async () => {
//   //   const profile = {
//   //     emails: [{ value: 'test@example.com' }],
//   //   };

//   //   const exUser = { id: 1 };

//   //   (query as jest.Mock).mockResolvedValueOnce([exUser]);

//   //   (generateAccessToken as jest.Mock).mockReturnValueOnce('mockedAccessToken');
//   //   (generateRefreshToken as jest.Mock).mockResolvedValueOnce(
//   //     'mockedRefreshToken',
//   //   );

//   //   const done = jest.fn();

//   //   await passport.authenticate('google', { session: false })(null, null, profile, done);

//   //   // 데이터베이스 쿼리 확인
//   //   expect(query).toHaveBeenCalledWith(expect.any(String), ['test@example.com']);

//   //   // 토큰 생성 확인
//   //   expect(generateAccessToken).toHaveBeenCalledWith(1);
//   //   expect(generateRefreshToken).toHaveBeenCalledWith(1);

//   //   // done 콜백 확인
//   //   expect(done).toHaveBeenCalledWith(null, {
//   //     accessToken: 'mockedAccessToken',
//   //     refreshToken: 'mockedRefreshToken',
//   //   });
//   // });

//   // it('should fail authentication when user does not exist', async () => {
//   //   const profile = {
//   //     emails: [{ value: 'test@example.com' }],
//   //   };

//   //   query.mockResolvedValueOnce([]);

//   //   const done = jest.fn();

//   //   const strategyCallback = passport.use.mock.calls[0][0].verify;

//   //   // Call the strategy callback function directly
//   //   await strategyCallback(
//   //     'mockedAccessToken',
//   //     'mockedRefreshToken',
//   //     profile,
//   //     done,
//   //   );

//   //   expect(query).toHaveBeenCalledWith(expect.any(String), [
//   //     'test@example.com',
//   //   ]);
//   //   expect(done).toHaveBeenCalledWith(null, null);
//   // });

//   // it('should handle errors during authentication', async () => {
//   //   const profile = {
//   //     emails: [{ value: 'test@example.com' }],
//   //   };

//   //   const error = new Error('Test error');

//   //   query.mockRejectedValueOnce(error);

//   //   const done = jest.fn();

//   //   await expect(
//   //     googleStrategy._verify(
//   //       'mockedAccessToken',
//   //       'mockedRefreshToken',
//   //       profile,
//   //       done,
//   //     ),
//   //   ).rejects.toThrow(error);

//   //   expect(query).toHaveBeenCalledWith(expect.any(String), [
//   //     'test@example.com',
//   //   ]);
//   //   expect(done).not.toHaveBeenCalled();
//   // });
// // });
