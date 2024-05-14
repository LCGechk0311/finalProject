import jwt from 'jsonwebtoken';
import jwtSecret from '../config/jwtSecret';
import { redisCli } from './DB';

// Access Token 생성 함수
export const generateAccessToken = (
  userId: string,
): { token: string; expiresAt: number } => {
  // 사용자 ID를 기반으로 새로운 Access Token 생성
  const accessToken = jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '1d',
  });
  const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  return { token: accessToken, expiresAt: expirationTime };
};

// Refresh Token 생성 함수
export const generateRefreshToken = async (userId: string) => {
  // 사용자 ID를 기반으로 새로운 Refresh Token 생성
  const refreshToken = jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: '30d', // 예: 30일
  });

  const expireIn = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

  const prevToken = await redisCli.get(userId);
  console.log(prevToken);

  // 이전 토큰이 존재하면 만료시킴
  if (prevToken) {
    console.log(1);
    await redisCli.del(userId); // 이전 토큰 삭제
  }
  redisCli
    .set(userId, refreshToken)
    .then(() => redisCli.get(userId))
    .then((redisValue : any) => {
      if (redisValue) {
        console.log('Refresh token found in Redis:', redisValue);
      } else {
        console.log('no found : ', userId);
      }
    })
    .catch((error : any) => {
      console.error('Error : ', error);
    });

  return { token: refreshToken, expireIn };
};

// Refresh Token의 유효성을 확인하고 사용자 ID 반환하는 함수
export const verifyRefreshToken = async (refreshToken: string, userId : string) => {
  try {
    console.log(refreshToken);
    return redisCli
      .get(userId)
      .then((redisValue : any) => {
        if (redisValue === refreshToken) {
          console.log('Refresh token found in Redis:', refreshToken);
          return userId; // Redis에 저장된 토큰이 요청된 토큰과 일치하면 사용자 ID 반환
        } else {
          console.log('Refresh token not found in Redis for userId:', userId);
          return null; // Redis에 저장된 토큰이 없거나 요청된 토큰과 일치하지 않으면 null 반환
        }
      })
      .catch((error : any) => {
        console.error('Error:', error);
        throw error;
      });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
