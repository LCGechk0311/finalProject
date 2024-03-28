import passport from 'passport';
require('dotenv').config();
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/tokenUtils';
import { query } from '../../utils/DB';

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_PASSWORD,
    // 콜백 URL 설정 (인증 완료 후 리디렉션되는 URL)
    callbackURL: '/api/users/google/callback',
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ) => {
    // Google OAuth 인증이 성공했을 때 실행되는 함수
    console.log('google profile : ', profile);
    try {
      // Google 프로필에서 이메일 정보 추출
      const email = profile.emails[0].value;
      // 이메일로 사용자를 데이터베이스에서 찾음
      const selectQuery = `
    SELECT * FROM user WHERE email = ?;
  `;
      const selectResult = await query(selectQuery, [email]);
      const exUser = selectResult[0];

      if (exUser) {
        // 사용자가 이미 존재하면 AccessToken과 RefreshToken을 생성
        const jwtAccessToken = generateAccessToken(exUser.id);
        const jwtRefreshToken = await generateRefreshToken(exUser.id);

        // AccessToken과 RefreshToken을 클라이언트에게 전달
        done(null, {
          accessToken: jwtAccessToken,
          refreshToken: jwtRefreshToken,
        });
      } else {
        // 사용자가 존재하지 않으면 인증 실패
        done(null, null);
      }
    } catch (error) {
      return done(error);
    }
  },
);

passport.use('google', googleStrategy);

export default googleStrategy;
