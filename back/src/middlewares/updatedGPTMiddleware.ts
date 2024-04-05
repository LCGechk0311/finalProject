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

  // const comment = await prisma.comment.updateMany({
  //   where: { diaryId, writeAi: authorId },
  //   data: {
  //     content: testChatGPT,
  //   },
  // });

  let queryText = `UPDATE comment SET content = $1 WHERE diaryId = $2 AND writeAi = $3`;
  let values = [testChatGPT, diaryId, authorId];
  let result = await query(queryText, values);
  console.log(result);
  console.log(3);

  if (result == 0) {
    await createdGPTComment(testChatGPT, authorId, diaryId);
  }
};
