import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { userValidateDTO } from '../dtos/userDTO';
import { IRequest } from 'types/request';
import { validate } from 'class-validator';
import { generateError } from '../utils/errorGenerator';

// 프리즈마 대체
import { prisma } from '../../prisma/prismaClient';
import { query } from '../utils/DB';

export const userLogin = async (req: IRequest, res: Response) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = '로그인'
    const { email, password } = req.body;
  
    const userInput = plainToClass(userValidateDTO, req.body);
  
    const errors = await validate(userInput);
  
    if (errors.length > 0) {
      throw generateError(500, '양식에 맞춰서 입력해주세요');
    }
  
    // prisma사용
    // const myInfo = await prisma.user.findUnique({
    //   where: {
    //     id: req.user.id,
    //   },
    //   include: {
    //     profileImage: true,
    //   },
    // });
    // if (!myInfo) {
    //   const response = emptyApiResponseDTO();
    //   return response;
    // }
  
    // // 사용자 정보와 토큰 데이터를 사용하여 user 객체 생성
    // const user = {
    //   token: req.token,
    //   refreshToken: req.refreshTokens,
    //   id: req.user.id,
    //   name: req.user.username,
    //   email: req.user.email,
    //   profileImage: myInfo.profileImage,
    // };
  
    const sqlQuery = `
      SELECT * FROM user
      WHERE id = ?;
    `;
  
    // 쿼리 실행을 비동기적으로 수행하기 위해 util.promisify를 사용
    const results = await query(sqlQuery, [req.user.id]);
  
    if (results.length === 0) {
      // 인증 실패
      return res.status(401).json({ error: 'x' });
    }
  
    // 인증 성공시 처리
    const user = {
      id: results[0].id,
      name: results[0].username,
      email: results[0].email,
      profileImage: results[0].profileImage,
    };
  
    return res.status(200).json({ data: user, message: '성공' });
  };