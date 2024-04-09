import { prisma } from '../../prisma/prismaClient';
import { query } from '../utils/DB';

import { FriendResponseDTO, PaginationResponseDTO } from '../dtos/friendDTO';
import { userResponseDTO } from '../dtos/userDTO';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { successApiResponseDTO } from '../utils/successResult';
import { plainToClass } from 'class-transformer';

export const checkFriend = async (userId: string, requestId: string) => {
  // const friend = await prisma.friend.findFirst({
  //   where: {
  //     OR: [
  //       {
  //         sentUserId: userId,
  //         receivedUserId: requestId,
  //       },
  //       {
  //         sentUserId: requestId,
  //         receivedUserId: userId,
  //       },
  //     ],
  //     status: true,
  //   },
  // });

  // return friend;

  const checkFriendSql = `
      SELECT * FROM friend
      WHERE 
        (sentUserId = ? AND receivedUserId = ?) OR
        (sentUserId = ? AND receivedUserId = ?)
      AND status = true;
    `;

    const result = await query(checkFriendSql, [userId, requestId, requestId, userId]);

    return result.length > 0 ? result[0] : null;
};

/** @description 친구 여부 */
export const weAreFriends = async (userId: string, requestId: string) => {
  const findFriendshipSql = `
      SELECT * FROM friend
      WHERE
        (sentUserId = ? AND receivedUserId = ?) OR
        (sentUserId = ? AND receivedUserId = ?);
    `;

  const result = await query(findFriendshipSql, [
    userId,
    requestId,
    requestId,
    userId,
  ]);

  return result.length > 0 ? result[0] : null;
};

/** @description 친구 요청 */
export const createFriends = async (
  sentUserId: string,
  receivedUserId: string,
) => {
  const createFriendsSql = `
      INSERT INTO friend (id, sentUserId, receivedUserId)
      VALUES (UUID(), ?, ?);
    `;

  await query(createFriendsSql, [sentUserId, receivedUserId]);

  const requestQuery = `select * from friend where sentUserId = ? and receivedUserId = ?;`;

  const friend = await query(requestQuery, [sentUserId, receivedUserId]);
  const friendResponseData = plainToClass(FriendResponseDTO, friend, {
    excludeExtraneousValues: true,
  });
  const response = successApiResponseDTO(friendResponseData);
  return response;
};

/** @description 보낸 친구 요청 목록 */
export const listRequestsSent = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const listRequestsSentSql = `
  SELECT JSON_OBJECT(
    'id', u.id,
    'username', u.username,
    'profileImage', COALESCE(fu.url, '[]')
  ) AS receivedUser
  FROM friend f
  JOIN user u ON f.receivedUserId = u.id
  LEFT JOIN fileupload fu ON u.id = fu.userId
  WHERE f.sentUserId = ? AND f.status = false
  ORDER BY f.id ASC
  LIMIT ?, ?;
`;

  const friend = await query(listRequestsSentSql, [
    userId,
    (page - 1) * limit,
    limit,
  ]);

  if (friend.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const countQuery = `select count(*) as totalItem from friend where sentUserId = ?;`;

  const totalItemResult = await query(countQuery, [userId]);
  const totalItem = totalItemResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const friendResponseDataList = friend.map((friend: any) =>
    plainToClass(FriendResponseDTO, friend, {
      excludeExtraneousValues: true,
    }),
  );
  const response = new PaginationResponseDTO(
    200,
    friendResponseDataList,
    pageInfo,
    '성공',
  );

  return response;
};

/** @description 요청 취소 */
export const cancelRequest = async (userId: string, requestId: string) => {

  const cancelRequestSql = `
      DELETE FROM friend
      WHERE sentUserId = ? AND receivedUserId = ?;
    `;
  const cancelRequestValues = [userId, requestId];

  const friend = await query(cancelRequestSql, cancelRequestValues);

  const friendResponseData = plainToClass(FriendResponseDTO, friend, {
    excludeExtraneousValues: true,
  });
  const response = successApiResponseDTO(friendResponseData);
  return response;
};

/** @description 받은 친구 요청 목록 */
export const listRequestsReceived = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const listRequestsReceivedSql = `
      SELECT JSON_OBJECT('id', sentUser.id,
        'username', sentUser.username,
        'profileImage', COALESCE(fu.url, '[]')
      ) as sentUser
      FROM friend f
      INNER JOIN user AS sentUser ON f.sentUserId = sentUser.id
      LEFT JOIN fileupload fu ON sentUser.id = fu.userId
      WHERE f.receivedUserId = ? AND f.status = false
      ORDER BY f.id ASC
      LIMIT ?, ?;
    `;

  const friend = await query(listRequestsReceivedSql, [
    userId,
    (page - 1) * limit,
    limit,
  ]);

  if (friend.length == 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const countQuery = `select count(*) as totalItem from friend where sentUserId = ?;`;

  const totalItemResult = await query(countQuery, [userId]);
  const totalItem = totalItemResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const friendResponseDataList = friend.map((friend: any) =>
    plainToClass(FriendResponseDTO, friend, {
      excludeExtraneousValues: true,
    }),
  );
  const response = new PaginationResponseDTO(
    200,
    friendResponseDataList,
    pageInfo,
    '성공',
  );
  return response;
};

/** @description 친구 수락 */
export const acceptFriend = async (userId: string, requestId: string) => {
  const acceptFriendSql = `
      UPDATE friend
      SET status = true
      WHERE sentUserId = ? AND receivedUserId = ?;
    `;

  const friend = await query(acceptFriendSql, [requestId, userId]);

  const friendResponseData = plainToClass(FriendResponseDTO, friend, {
    excludeExtraneousValues: true,
  });
  const response = successApiResponseDTO(friendResponseData);
  return response;
};

export const reqList = async (userId: string, requestId: string) => {
  const exFriendQuery = `SELECT * FROM friend WHERE (sentUserId = ? AND receivedUserId = ? AND status = false);`;

  const result = await query(exFriendQuery, [requestId, userId]);
  console.log(result);

  return result.length > 0 ? result[0] : null;
};

/** @description 친구 거절 */
export const rejectFriend = async (userId: string, requestId: string) => {
  const rejectFriendSql = `
      DELETE FROM friend
      WHERE sentUserId = ? AND receivedUserId = ?;
    `;
  await query(rejectFriendSql, [requestId, userId]);

  const friendResponseData = plainToClass(
    FriendResponseDTO,
    {},
    {
      excludeExtraneousValues: true,
    },
  );
  const response = successApiResponseDTO(friendResponseData);
  return response;
};

/**
 * @description 나의 모든 친구 가져오기
 * @param userId
 * @returns
 */
export const getMyWholeFriends = async (userId: string) => {
  const sqlQuery = `
    SELECT *
    FROM Friend
    WHERE (sentUserId = ? OR receivedUserId = ?) AND status = true
  `;

  const result = await query(sqlQuery, [userId, userId]);
  return result;
};

/** @description 친구 목록 */
export const getMyFriends = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const myFriendsSentQuery = `
    SELECT receivedUserId AS receivedUserId
    FROM friend
    WHERE sentUserId = ? AND status = true
  `;
  const myFriendsReceivedQuery = `
    SELECT sentUserId AS sentUserId
    FROM friend
    WHERE receivedUserId = ? AND status = true
  `;

  const myFriendsSent = await query(myFriendsSentQuery, [userId]);
  const myFriendsReceived = await query(myFriendsReceivedQuery, [userId]);

  const uniqueFriendIds: string[] = Array.from(
    new Set([
      ...myFriendsSent.map((friend: any) => friend.receivedUserId),
      ...myFriendsReceived.map((friend: any) => friend.sentUserId),
    ]),
  );

  if (uniqueFriendIds.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const userQuery = `
    SELECT id, username
    FROM user
    WHERE id IN (${uniqueFriendIds.map(() => '?').join(',')})
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...uniqueFriendIds, limit, (page - 1) * limit];
  const users = await query(userQuery, queryParams);

  if (users.length === 0) {
    const response = emptyApiResponseDTO();
    return response;
  }

  const totalCountQuery = `
    SELECT COUNT(*) AS totalItem
    FROM user
    WHERE id IN (${uniqueFriendIds.map(() => '?').join(',')})
  `;
  const totalCountParams = [...uniqueFriendIds];
  const [{ totalItem }] = await query(totalCountQuery, totalCountParams);
  const totalPage = Math.ceil(totalItem / limit);

  const pageInfo = { totalItem, totalPage, currentPage: page, limit };

  const userResponseDataList = users.map((user: any) =>
    plainToClass(userResponseDTO, user, { excludeExtraneousValues: true }),
  );
  const response = new PaginationResponseDTO(
    200,
    userResponseDataList,
    pageInfo,
    '성공',
  );
  return response;
};

/** @description 친구 삭제 */
export const deleteFriend = async (userId: string, friendId: string) => {
  const sqlQuery = `
  DELETE FROM Friend
  WHERE ((sentUserId = ? AND receivedUserId = ?) OR (sentUserId = ? AND receivedUserId = ?))
  AND status = true
`;

  await query(sqlQuery, [userId, friendId, friendId, userId]);

  const friendResponseData = plainToClass(
    FriendResponseDTO,
    {},
    {
      excludeExtraneousValues: true,
    },
  );
  const response = successApiResponseDTO(friendResponseData);
  return response;
};
