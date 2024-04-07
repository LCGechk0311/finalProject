import { NextFunction, Response } from 'express';
import { prisma } from '../../prisma/prismaClient';
import { createdGPTComment } from '../services/commentService';
import { IRequest } from 'types/request';
import { callChatGPT } from '../utils/chatGPT';
import { query } from '../utils/DB';

export const updatedGPTComment = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  const { content, userId: authorId, diaryId } = req.inputAI;
  const testChatGPT = await callChatGPT(content);

  let queryText = `UPDATE comment SET content = ? WHERE diaryId = ? AND writeAi = ?`;
  let result = await query(queryText, [testChatGPT, diaryId, authorId]);

  if (result == 0) {
    await createdGPTComment(testChatGPT, authorId, diaryId);
  }
};
