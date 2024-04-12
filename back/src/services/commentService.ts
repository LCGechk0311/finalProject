import { plainToClass } from 'class-transformer';
import { commentResponseDTO, PaginationResponseDTO } from '../dtos/commentDTO';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { successApiResponseDTO } from '../utils/successResult';
import { nonAuthorizedApiResponseDTO } from '../utils/nonAuthorizeResult';
import axios from 'axios';
import { callChatGPT } from '../utils/chatGPT';
import dotenv from 'dotenv';
import { query } from '../utils/DB';
dotenv.config();

//댓글 작성
export async function createdComment(
  inputData: {
    content: string;
    nestedComment: string; // 댓글(null)인지 대댓글(원댓글의 id)인지 확인
  },
  authorId: string,
  diary_id: string,
) {
  const { content, nestedComment } = inputData;

  // 댓글 이모지 넣는 코드
  const responseData = await axios.post(
    'http://kdt-ai-8-team02.elicecoding.com:5000/flask/predict',
    {
      text: inputData.content,
    },
  );

  const emotion = responseData.data;

  const emotionType = emotion.emotion;

  const sqlQuery = `select * from emoji where type = ?;`;

  const emojiResult = await query(sqlQuery, [emotionType]);

  const randomIndex = Math.floor(Math.random() * emojiResult.length);

  const emoji = emojiResult[randomIndex].emotion;

  const createQuery = `insert into comment (id,writeAi, diaryId, authorId, content, nestedComment, emoji)
  values (UUID(),UUID(),?,?,?,?,?)`;

  await query(createQuery, [diary_id, authorId, content, nestedComment, emoji]);

  const commentResponseData = plainToClass(
    commentResponseDTO,
    {},
    {
      excludeExtraneousValues: true,
    },
  );
  const response = successApiResponseDTO(commentResponseData);
  return response;
}

// 댓글 조회
export async function getCommentByDiaryId(
  diary_id: string,
  page: number,
  limit: number,
) {
  // const comment = await prisma.comment.findMany({
  //   skip: (page - 1) * limit,
  //   take: limit,
  //   where: { diaryId: diary_id, nestedComment: null },
  //   select: {
  //     id: true,
  //     // 댓글 작성자의 id, username, porfileImage를 함께 응답
  //     author: {
  //       select: {
  //         id: true,
  //         username: true,
  //         profileImage: true,
  //       },
  //     },
  //     diaryId: true,
  //     content: true,
  //     emoji: true,
  //     createdAt: true,
  //     updatedAt: true,
  //     // 대댓글은 reComment에 배열로 포함하여 응답
  //     reComment: {
  //       select: {
  //         id: true,
  //         author: {
  //           select: {
  //             id: true,
  //             username: true,
  //             profileImage: true,
  //           },
  //         },
  //         diaryId: true,
  //         content: true,
  //         emoji: true,
  //         createdAt: true,
  //         updatedAt: true,
  //       },
  //     },
  //   },
  //   orderBy: { createdAt: 'asc' },
  // });
  const sqlQuery = `
  SELECT 
    c.id, 
    c.diaryId, 
    c.content, 
    c.emoji, 
    c.createdAt, 
    c.updatedAt,
    a.id as authorId, 
    a.username as username, 
    a.profile as authorProfileImage,
    rc.id as reCommentId, 
    rc.diaryId as reCommentDiaryId, 
    rc.content as reCommentContent,
    rc.emoji as reCommentEmoji, 
    rc.createdAt as reCommentCreatedAt, 
    rc.updatedAt as reCommentUpdatedAt,
    ra.id as reCommentAuthorId, 
    ra.username as username, 
    ra.profile as reCommentAuthorProfileImage
FROM comment c
LEFT JOIN user a ON c.authorId = a.id
LEFT JOIN comment rc ON c.id = rc.nestedComment
LEFT JOIN user ra ON rc.authorId = ra.id
WHERE c.diaryId = ?
ORDER BY c.createdAt ASC
LIMIT ?, ?;
`;

  const comment = await query(sqlQuery, [diary_id, (page - 1) * limit, limit]);
  // 댓글이 없을 경우 응답
  if (comment.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const totalItemQuery = `
      SELECT COUNT(*) AS totalCount
      FROM comment
      WHERE diaryId = ?;
    `;
  const totalItemResult = await query(totalItemQuery, [diary_id]);
  const totalItem = totalItemResult[0].totalCount;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const commentResponseDataList = comment.map((comment: any) =>
    plainToClass(commentResponseDTO, comment, {
      excludeExtraneousValues: true,
    }),
  );

  const response = new PaginationResponseDTO(
    200,
    commentResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
}

// 댓글 수정
export async function updatedComment(
  inputData: {
    content: string;
    emoji: string;
  },
  comment_id: string,
  authorId: string,
) {
  // 댓글 이모지 넣는 코드
  const responseData = await axios.post(
    'http://kdt-ai-8-team02.elicecoding.com:5000/flask/predict',
    {
      text: inputData.content,
    },
  );
  const emotion = responseData.data;

  const emotionType = emotion.emoji;

  const sqlQuery = `select * from emoji where type = ?;`;

  const emojiResult = await query(sqlQuery, [emotionType]);

  const randomIndex = Math.floor(Math.random() * emojiResult.length);

  const emoji = emojiResult[randomIndex].emotion;

  // 댓글 작성자 본인인지 확인을 위한 조회
  const userCheckQuery = `select authorId from comment where id = ?;`;

  const userCheckResult = await query(userCheckQuery, [comment_id]);

  // 댓글 작성자가 맞다면 수정 진행
  if (userCheckResult[0].authorId === authorId) {
    const updateCommentQuery = `update comment set content = ?, emoji = ?
    where id = ?;`;

    await query(updateCommentQuery,[inputData.content, emoji, comment_id]);

    const selectQuery = `select * from comment where id = ?;`;

    const comment = await query(selectQuery, [comment_id]);

    const commentResponseData = plainToClass(commentResponseDTO, comment, {
      excludeExtraneousValues: true,
    });

    const response = successApiResponseDTO(commentResponseData);

    return response;
  } else {
    const response = nonAuthorizedApiResponseDTO();

    return response;
  }
}

// 댓글 삭제
export async function deletedComment(comment_id: string, authorId: string) {
  // 댓글 작성자 본인인지 확인을 위한 조회
  const userCheckQuery = `select authorId, writeAi from comment where id = ?;`;

  const userCheckResult = await query(userCheckQuery, [comment_id]);

  // 댓글 작성자가 맞다면 삭제 진행
  if (userCheckResult[0].authorId == authorId || userCheckResult[0].writeAi == authorId) {

    const deleteQuery = `delete from comment where id = ?;`;

    await query(deleteQuery, [comment_id]);

    const commentResponseData = plainToClass(commentResponseDTO, {}, {
      excludeExtraneousValues: true,
    });

    const response = successApiResponseDTO(commentResponseData);

    return response;
  } else {
    const response = nonAuthorizedApiResponseDTO();

    return response;
  }
}

// chatGPT 활용하여 공감 한마디 댓글 추가
export async function createdGPTComment(
  content: string,
  authorId: string,
  diaryId: string,
) {
  const testChatGPT = await callChatGPT(content);

  const checkDiaryQuery = `
      SELECT * FROM diary
      WHERE id = ?;
    `;
  const checkDiaryValues = [diaryId];
  const checkDiaryResult = await query(checkDiaryQuery, checkDiaryValues);

  if (checkDiaryResult.length > 0) {
    const createCommentQuery = `
        INSERT INTO comment (diaryId, authorId, content, writeAi)
        VALUES (?, ?, ?, ?);
      `;
    const createCommentValues = [
      diaryId,
      process.env.AI_ID,
      testChatGPT,
      authorId,
    ];
    await query(createCommentQuery, createCommentValues);
  }
}

// chatGPT 한마디 댓글 수정(다이어리 내용이 수정될때 한마디도 수정)
export async function updatedGPTComment(
  content: string,
  authorId: string,
  diaryId: string,
) {
  const testChatGPT = await callChatGPT(content);

  const updateQuery = `
    UPDATE comments 
    SET content = ? 
    WHERE diaryId = ? AND writeAi = ?;
  `;

  const updateResult = await query(updateQuery, [testChatGPT, diaryId, authorId]);

  if (updateResult.affectedRows === 0) {
    await createdGPTComment(testChatGPT, authorId, diaryId);
  }
}
