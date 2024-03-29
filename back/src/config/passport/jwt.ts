import passportJWT from 'passport-jwt';
import jwtSecret from '../jwtSecret';
import { query } from '../../utils/DB';

// Passport-JWT에서 필요한 모듈 및 객체를 가져옵니다.
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const jwtStrategy = new JWTStrategy(
  {
    // JWT를 추출하는 방법을 설정합니다. 여기서는 HTTP 요청 헤더의 Bearer 토큰을 추출합니다.
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    // JWT의 시크릿 키를 설정합니다. 이 시크릿 키는 JWT를 생성할 때 사용된 키와 일치해야 합니다.
    secretOrKey: jwtSecret,
  },
  async (jwtPayload, done) => {
    try {
      const selectQuery = `
    SELECT * FROM user WHERE id = ?;
  `;
      const selectResult = await query(selectQuery, [jwtPayload.id]);
      const user = selectResult[0];

      if (!user) {
        return done(null, false, { message: '사용자를 찾을 수 없습니다.' });
      }
      // 사용자를 찾은 경우, 인증을 완료하고 해당 사용자 정보를 반환합니다.
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
);

export default jwtStrategy;
