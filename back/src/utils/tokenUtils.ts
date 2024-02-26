import jwt from 'jsonwebtoken';
import jwtSecret from '../config/jwtSecret';
import { prisma } from '../../prisma/prismaClient';
import redisClient from './DB';

// Access Token 생성 함수
export const generateAccessToken = (user: {
  id: string;
  username: string;
  email: string;
}): { token: string; expiresAt: number } => {
  // 사용자 ID를 기반으로 새로운 Access Token 생성
  const accessToken = jwt.sign({ id: user.id }, jwtSecret, {
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

  const prevToken = redisClient.get(userId);

  // 이전 토큰이 존재하면 만료시킴
  if (prevToken) {
    await redisClient.del(userId); // 이전 토큰 삭제
  }

  redisClient.set(userId, refreshToken);

  redisClient
    .get(userId)
    .then((refreshToken) => {
      if (refreshToken) {
        console.log('Refresh token found in Redis:', refreshToken);
      } else {
        console.log('no found : ', userId);
      }
    })
    .catch((error) => {
      console.error('Error : ', error);
    });

  return { token: refreshToken, expireIn };
};

// Refresh Token을 데이터베이스에 저장하는 함수
export const storeRefreshTokenInDatabase = async (
  userId: string,
  refreshToken: string,
) => {
  try {
    // 기존 Refresh Token을 삭제
    await prisma.refreshToken.deleteMany({
      where: {
        userId: userId,
      },
    });

    // 새로운 Refresh Token 저장
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
      },
    });
  } catch (error) {
    throw error;
  }
};

// Refresh Token의 유효성을 확인하고 사용자 ID 반환하는 함수
export const verifyRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  // // 데이터베이스에서 해당 Refresh Token을 찾기
  // const refreshTokenData = await prisma.refreshToken.findUnique({
  //   where: {
  //     token: refreshToken,
  //   },
  // });

  // if (!refreshTokenData) {
  //   // 해당 Refresh Token이 데이터베이스에 없으면 null 반환
  //   return null;
  // }
  // // Refresh Token이 있으면 해당 사용자 ID 반환
  // return refreshTokenData.userId;
  try {
    // refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAzZjdiN2YwLWMzMTEtMTFlZS1hNjhjLWIwMjVhYTM2OGEzMyIsImlhdCI6MTcwODk1MDQ1NywiZXhwIjoxNzExNTQyNDU3fQ.ayMANJ0uLlhhtPVRh8IyNeNUPUmOZrcCXNjp6I9JvJU";
    console.log(refreshToken);
    return redisClient
      .get(userId)
      .then((storedRefreshToken) => {
        if (storedRefreshToken && storedRefreshToken === refreshToken) {
          console.log('Refresh token found in Redis:', storedRefreshToken);
          return userId; // Redis에 저장된 토큰이 요청된 토큰과 일치하면 사용자 ID 반환
        } else {
          console.log('Refresh token not found in Redis for userId:', userId);
          return null; // Redis에 저장된 토큰이 없거나 요청된 토큰과 일치하지 않으면 null 반환
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        throw error;
      });
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
