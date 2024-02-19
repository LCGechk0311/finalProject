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
export const generateRefreshToken = (user: {
  id: string;
  username: string;
  email: string;
}): string => {
  // 사용자 ID를 기반으로 새로운 Refresh Token 생성
  const refreshToken = jwt.sign({ id: user.id }, jwtSecret, {
    expiresIn: '30d', // 예: 30일
  });

  redisClient.set(user.id, refreshToken);

  redisClient
    .get(user.id)
    .then((refreshToken) => {
      if (refreshToken) {
        console.log('Refresh token found in Redis:', refreshToken);
      } else {
        console.log('no found : ', user.id);
      }
    })
    .catch((error) => {
      console.error('Error : ', error);
    });

  return refreshToken;
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
export const verifyRefreshToken = async (userId: string, refreshToken: string) => {
  try {
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

    return userId;
  } catch (error) {
    throw error;
  }
};
