import { Request, Response } from 'express';
import { plainToClass } from 'class-transformer';
import { userValidateDTO } from '../dtos/userDTO';
import { IRequest } from 'types/request';
import { validate } from 'class-validator';
import { generateError } from '../utils/errorGenerator';

export const userLogin = async (req: IRequest, res: Response) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = '로그인'
    const { email, password } = req.body;
  
    const userInput = plainToClass(userValidateDTO, req.body);
  
    const errors = await validate(userInput);
  
    if (errors.length > 0) {
      throw generateError(500, '양식에 맞춰서 입력해주세요');
    }
  
    // 인증 성공시 처리
    const user = {
      id: req.user.id,
      name: req.user.username,
      email: req.user.email,
      profileImage: req.user.profileImage,
    };
  
    return res.status(200).json({ data: user, message: '성공' });
  };

  export const sessionLogin = async (req : IRequest, res : Response) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = '세션로그인'
    const { email, password } = req.body;
  
    const userInput = plainToClass(userValidateDTO, req.body);
  
    const errors = await validate(userInput);
  
    if (errors.length > 0) {
      throw generateError(500, '양식에 맞춰서 입력해주세요');
    }
  
    // 인증 성공시 처리
    const user = {
      id: req.user.id,
      name: req.user.username,
      email: req.user.email,
      profileImage: req.user.profileImage,
    };
  
    req.session.save(() => {
      return res.status(200).json({ data: user, message: '성공' });
    });
  }