import { checkFriend, getMyWholeFriends, weAreFriends } from './friendService';
import { calculatePageInfo } from '../utils/pageInfo';
import { DiaryResponseDTO, PaginationResponseDTO } from '../dtos/diaryDTO';
import { plainToClass } from 'class-transformer';
import { successApiResponseDTO } from '../utils/successResult';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { sendEmail } from '../utils/email';
import { generateEmotionString } from '../utils/emotionFlask';
import { prisma } from '../../prisma/prismaClient';
import { generateError } from '../utils/errorGenerator';
import { response } from 'express';
import { findMode } from '../utils/modeEmotion';
import { query } from '../utils/DB';

// 체크하는 용도 -----------------------------------------------
/**
 * @description 다이어리 작성 전 해당 날짜에 이미 다이어리가 존재하는지 체크
 * @param createdDate
 * @returns
 */
export const getDiaryByDateService = async (
  userId: string,
  createdDate: Date,
) => {
  const formattedDate = new Date(createdDate).toISOString().slice(0, 10);

  const sqlQuery = `
    SELECT * FROM diary
    WHERE authorId = ? AND DATE(createdDate) = ?
    LIMIT 1;
  `;

  const diary = await query(sqlQuery, [userId, formattedDate]);

  return diary;
};

/**
 * @description delete,update해주기 전에 작성자 일치하는지 체크
 * @param diaryId
 * @param userId
 * @returns
 */
export const verifyDiaryAuthor = async (diaryId: string, userId: string) => {
  const sqlQuery = `
    SELECT authorId FROM diary
    WHERE id = ?;
  `;
  const diary = await query(sqlQuery, [diaryId]);

  if (!diary) throw generateError(404, '다이어리가 존재하지 않습니다.');
  if (diary[0].authorId != userId)
    throw generateError(403, '작성자가 아닙니다.');

  return true;
};
//-------------------------------CRUD-----------------------------------
/**
 * 다이어리 작성
 * @param title
 * @param content
 * @param authorId
 * @returns diary (새롭게 생성된 diary Object)
 */

export const createDiaryService = async (
  authorId: string,
  inputData: any,
  fileUrls: string[],
) => {
  inputData.emotion = await generateEmotionString(inputData.content);
  inputData.emoji = '❎';
  inputData.authorId = authorId;

  if (fileUrls && fileUrls.length > 0) {
    inputData.filesUpload = {
      create: fileUrls.map((url) => ({
        url,
      })),
    };
  }
  // 쿼리 실행
  const sqlQuery = `
    INSERT INTO diary (id, ${Object.keys(inputData).join(', ')})
    VALUES (UUID(), ${Object.values(inputData)
      .map((value) => (typeof value === 'string' ? `'${value}'` : value))
      .join(', ')});
  `;
  await query(sqlQuery);
  const selectQuery = `
    SELECT * FROM diary WHERE authorId = ?;
  `;

  const selectResult = await query(selectQuery, [authorId]);

  const diary = selectResult[0];
  console.log(diary);

  const diaryResponseData = plainToClass(DiaryResponseDTO, diary, {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(diaryResponseData);
  return response;
};

/**
 * 내 글 모두 가져오기
 * @param userId
 * @param page
 * @param limit
 * @returns diaries (limit 개수먄큼 반환)
 */
export const getAllMyDiariesService = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  const diaryQuery = `
      SELECT * FROM diary
      WHERE authorId = ?
      ORDER BY createdDate DESC
      LIMIT ?, ?;
    `;

  const diaries = await query(diaryQuery, [userId, skip, limit]);

  // 다이어리 결과 없을 때 204, 빈 배열 반환
  if (diaries.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const countQuery = `
      SELECT COUNT(*) AS totalItem FROM diary
      WHERE authorId = ?;
    `;

  const totalItemResult = await query(countQuery, [userId]);
  const totalItem = totalItemResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const diaryResponseDataList = diaries.map((diary: any) =>
    plainToClass(DiaryResponseDTO, diary, { excludeExtraneousValues: true }),
  );

  const response = new PaginationResponseDTO(
    200,
    diaryResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

/**
 * @description 월별로 다이어리
 * @param userId
 * @param month
 * @returns
 */
export const getDiaryByMonthService = async (
  userId: string,
  year: number,
  month: number,
) => {
  const ltMonth = month == 12 ? 1 : month + 1;
  const ltYear = month == 12 ? year + 1 : year;

  const diaryQuery = `
      SELECT * FROM diary
      WHERE authorId = ? AND
      createdDate >= ? AND
      createdDate < ?;
    `;

  const diaries = await query(diaryQuery, [
    userId,
    `${year}-${month}-01`,
    `${ltYear}-${ltMonth}-01`,
  ]);

  // 검색 결과 없을 때 빈배열
  if (diaries.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const diaryResponseData = diaries.map((diary: any) => {
    return plainToClass(DiaryResponseDTO, diary, {
      excludeExtraneousValues: true,
    });
  });
  const response = successApiResponseDTO(diaryResponseData);
  return response;
};

/**
 * 다이어리 하나 가져오기
 * @param diaryId
 * @returns
 */
export const getOneDiaryService = async (userId: string, diaryId: string) => {
  const diaryQuery = `
      SELECT d.*, u.id as authorId, u.username, u.email, fu.url as profileImage, f.url
      FROM diary d
      JOIN user u ON d.authorId = u.id
      LEFT JOIN fileupload fu ON u.id = fu.userId
      LEFT JOIN diaryfileUpload f ON d.id = f.diaryId
      WHERE d.id = ?;
    `;

  const diary = await query(diaryQuery, [diaryId]);

  if (diary === null) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const friend = await checkFriend(userId, diary.authorId);

  const isAccessible =
    diary[0].authorId == userId || // 내글인 경우
    (friend && diary[0].is_public != 'private') || // 친구 글 (비공개 제외)
    diary[0].is_public == 'all'; // 모르는 사람 글 (전체공개만)
  if (isAccessible) {
    const diaryResponseData = plainToClass(DiaryResponseDTO, diary[0], {
      excludeExtraneousValues: true,
    });
    const response = successApiResponseDTO(diaryResponseData);

    return response;
  }
  //내 글이 아닌데 private일 경우
  const response = emptyApiResponseDTO();
  return response;
};

/**
 * @description 내 친구들의 다이어리 가져오기 (최신순)
 * @param userId (로그인 한 유저의 userId)
 * @param page
 * @param limit
 * @param select
 * @returns
 */
export const getFriendsDiaryService = async (
  page: number,
  limit: number,
  emotion: string | undefined,
  friendIdList: string[],
) => {
  // const friendsDiaryQuery = {
  //   where: {
  //     // 친구 글 (비공개 제외)
  //     authorId: { in: friendIdList },
  //     NOT: [
  //       {
  //         is_public: 'private',
  //       },
  //     ],
  //   },
  //   skip: (page - 1) * limit,
  //   take: limit,
  //   include: {
  //     author: {
  //       select: {
  //         id: true,
  //         username: true,
  //         email: true,
  //         profileImage: true,
  //       },
  //     },
  //   },
  // };

  // if (emotion != 'all') {
  //   (friendsDiaryQuery.where as any).emotion = emotion;
  // }

  let whereClause = `authorId IN (${friendIdList
    .map((id) => `'${id}'`)
    .join(', ')}) AND is_public != 'private'`;
  if (emotion && emotion !== 'all') {
    whereClause += ` AND emotion = '${emotion}'`;
  }

  const diaryQuery = `
      SELECT d.*, u.id as authorId, u.username, u.email, u.profileImage
      FROM diary d
      JOIN user u ON d.authorId = u.id
      WHERE ${whereClause}
      ORDER BY d.createdDate DESC
      LIMIT ?, ?;
    `;

  const friendsDiary = await query(diaryQuery, [(page - 1) * limit, limit]);

  // 친구들의 다이어리 가져오기 (최신순)
  // const friendsDiary = await prisma.diary.findMany({
  //   ...friendsDiaryQuery,
  //   orderBy: { createdDate: 'desc' },
  // });

  // 친구가 없거나 친구가 쓴 글이 없을 경우
  if (friendsDiary.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }
  const diaryResponseDataList = friendsDiary.map((diary: any) =>
    plainToClass(DiaryResponseDTO, diary, { excludeExtraneousValues: true }),
  );

  // 총 글 개수, 페이지 수
  // const { totalItem, totalPage } = await calculatePageInfo(
  //   'diary',
  //   limit,
  //   friendsDiaryQuery.where,
  // );

  const countQuery = `select count(*) as totalItem from diary where ${whereClause}`;

  const totalItemResult = await query(countQuery);
  const totalItem = totalItemResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const response = new PaginationResponseDTO(
    200,
    diaryResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

// 모르는 유저의 공개범위 all 다이어리 가져오기
export const getAllDiaryService = async (
  userId: string,
  page: number,
  limit: number,
  emotion: string,
  friendIdList: string[],
) => {
  emotion = 'all';

  let whereConditions = [`(is_public = 'all' and authorId != ?)`];

  const queryParams = [userId];

  if (friendIdList.length > 0) {
    const friendIdCondition = `(is_public != 'private' and authorId IN (${friendIdList
      .map(() => '?')
      .join(',')}))`;
    whereConditions.push(friendIdCondition);
    queryParams.push(...friendIdList);
  }

  if (emotion && emotion !== 'all') {
    whereConditions.push(`emotion = ?`);
    queryParams.push(emotion);
  }

  const diaryQuery = `SELECT d.*, u.id AS authorId, u.username, u.email, u.description, fu.url AS profileImage
    FROM diary d
    JOIN user u ON d.authorId = u.id
    LEFT JOIN fileupload fu ON u.id = fu.userId
    WHERE ${whereConditions}
    ORDER BY d.createdDate DESC
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}`;

  const allDiary = await query(diaryQuery, queryParams);

  if (allDiary.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const diaryResponseDataList = allDiary.map((diary: any) =>
    plainToClass(DiaryResponseDTO, diary, { excludeExtraneousValues: true }),
  );
  console.log(diaryResponseDataList);

  const countQuery = `select count(*) as totalItem from diary where ${whereConditions}`;

  const totalItemResult = await query(countQuery, queryParams);
  const totalItem = totalItemResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };
  const response = new PaginationResponseDTO(
    200,
    diaryResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

export const updateDiaryService = async (
  userId: string,
  diaryId: string,
  inputData: any,
) => {
  if (inputData.content) {
    inputData.emotion = await generateEmotionString(
      inputData.content as string,
    );
    inputData.emoji = '❎';
  }
  const updateQuery = `
      UPDATE diary
      SET ${Object.entries(inputData)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(', ')}
      WHERE id = ? AND authorId = ?;
    `;

  const result = await query(updateQuery, [diaryId, userId]);

  if (result.affectedRows === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const selectQuery = `
  SELECT d.*, u.id as authorId, u.username, u.email, fu.url as profileImage
  FROM diary d
  JOIN user u ON d.authorId = u.id
  LEFT JOIN fileupload fu ON u.id = fu.userId
  WHERE d.id = ?;
`;

  const updatedDiary = await query(selectQuery, [diaryId]);

  // if (updatedDiary == null) {
  //   const response = emptyApiResponseDTO();
  //   return response;
  // }
  const diaryResponseData = plainToClass(DiaryResponseDTO, updatedDiary, {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(diaryResponseData);
  return response;
};

export const deleteDiaryService = async (userId: string, diaryId: string) => {
  const queryText = `DELETE FROM diary WHERE id = ? AND authorId = ?`;
  await query(queryText, [diaryId, userId]);

  const diaryResponseData = plainToClass(
    DiaryResponseDTO,
    {},
    {
      excludeExtraneousValues: true,
    },
  );

  const response = successApiResponseDTO(diaryResponseData);
  return response;
};

export const selectedEmojis = async (
  selectedEmotion: string,
  selectedEmoji: string,
  diaryId: string,
  userId: string,
) => {
  const emojiQuery = `SELECT audioUrl FROM emoji where type = ?`;

  const emojiRecord = await query(emojiQuery, [selectedEmotion]);

  const audioUrl = emojiRecord[0].audioUrl;

  const updateQuery = `update diary set emoji ?, audioUrl = ? , emotion = ? where id = ? and authorId = ?`;

  const result = await query(updateQuery, [
    selectedEmoji,
    audioUrl,
    selectedEmotion,
    diaryId,
    userId,
  ]);

  if (result.affectRows === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const selectQuery = `select d.*, u.id as AuthorInDiaryDTO, u.username, u.email, u.profileImage from diary d join user u on d.authorId = u.id where d.id=?`;

  const updatedDiary = await query(selectQuery, [diaryId]);

  const diaryResponseData = plainToClass(DiaryResponseDTO, updatedDiary, {
    excludeExtraneousValues: true,
  });

  const response = successApiResponseDTO(diaryResponseData);
  return response;
};

/**
 * @description 다이어리 검색
 * @param search
 * @returns
 */
export const searchDiaryService = async (
  userId: string,
  search: string,
  page: number,
  limit: number,
  friendIdList: string[],
) => {
  const searchList = search.split(' ');
  console.log(1);
  console.log(searchList);
  console.log(userId);

  const modifiedSearch = searchList.map((search) => {
    return `${search}`;
  });
  const fullTextQuery = modifiedSearch.join(' ');

  const searchDiaryQuery = {
    skip: (page - 1) * limit,
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          email: true,
          profileImage: true,
        },
      },
    },
    where: {
      OR: [
        {
          // 전체공개 다이어리 ( 내 글 제외 )
          is_public: 'all',
          NOT: {
            authorId: userId,
          },
        },
        {
          // 친구 글 (비공개 제외)
          NOT: {
            is_public: 'private',
          },
          authorId: { in: friendIdList },
        },
      ],
      content: {
        search: fullTextQuery,
      },
      title: {
        search: fullTextQuery,
      },
    },
  };

  const searchedDiary = await prisma.diary.findMany({
    ...searchDiaryQuery,
    orderBy: {
      _relevance: {
        fields: ['title', 'content'],
        search: fullTextQuery,
        sort: 'desc',
      },
    },
  });
  console.log(fullTextQuery);
  console.log(searchedDiary);

  if (searchedDiary.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const { totalItem, totalPage } = await calculatePageInfo(
    'diary',
    limit,
    searchDiaryQuery.where,
  );

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };
  const diaryResponseDataList = searchedDiary.map((diary) =>
    plainToClass(DiaryResponseDTO, diary, { excludeExtraneousValues: true }),
  );

  const response = new PaginationResponseDTO(
    200,
    diaryResponseDataList,
    pageInfo,
    '성공',
  );
  return response;
};

/**
 * @description 이 달의 이모지 가져오기
 * @param userId
 * @param year
 * @param month
 * @returns
 */
export const getEmotionOftheMonthService = async (
  userId: string,
  year: number,
  month: number,
) => {
  let emoji = ''; // 이 달의 이모지
  const ltMonth = month == 12 ? 1 : month + 1;
  const ltYear = month == 12 ? year + 1 : year;

  // 작성자의 한 달 다이어리 가져오기
  const sqlQuery = `
      SELECT emotion, emoji
      FROM diary
      WHERE authorId = ? AND createdDate >= ? AND createdDate < ?;
    `;

  const emotionsAndEmojis = await query(sqlQuery, [
    userId,
    `${year}-${month}-01`,
    `${ltYear}-${ltMonth}-01`,
  ]);

  // 작성한 다이어리가 없을 땐 204 No content반환
  if (emotionsAndEmojis.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }
  const emotions = emotionsAndEmojis.map((emotion: any) => {
    return emotion.emotion;
  });
  // const emotions = emotionsAndEmojis.map((entry) => entry.emotion);

  const modeEmotion = findMode(emotions);

  if (modeEmotion == null) {
    const response = emptyApiResponseDTO();
    return response;
  }

  for (let i = 0; i < emotionsAndEmojis.length; i++) {
    if (emotionsAndEmojis[i].emotion == modeEmotion) {
      emoji = emotionsAndEmojis[i].emoji;
      break;
    }
  }

  const response = { emotion: modeEmotion, emoji };
  return response;
};
