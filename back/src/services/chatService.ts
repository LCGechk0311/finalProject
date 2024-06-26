import { prisma } from '../../prisma/prismaClient';
import { query } from '../utils/DB';

/** @description 현재 사용자 */
export const currentUser = async (currentUserId: string) => {
  // const user = await prisma.user.findUnique({
  //   where: {
  //     id: currentUserId,
  //   },
  // });
  const selectQuery = `
    SELECT * FROM user WHERE id = ?;
  `;

  const selectResult = await query(selectQuery, [currentUserId]);

  const user = selectResult[0];
  return user;
};

/** @description roomId 생성 */
export const createRoomId = (currentUserId: string, chatPartnerId: string) => {
  const userIds = [currentUserId, chatPartnerId];
  userIds.sort(); // Sort the user IDs lexicographically to ensure consistency
  const roomId = userIds.join('_');
  return roomId;
};

/** @description 채팅룸 생성 */
export const createChatRoom = async (roomId: string) => {
  // const room = await prisma.chatRoom.create({
  //   data: {
  //     id: roomId,
  //   },
  // });
  const sqlQuery = `
    INSERT INTO chatRoom (id)
    VALUES (?);
  `;

  await query(sqlQuery, [roomId]);

  const selectQuery = `
    SELECT * FROM chatRoom WHERE id = ?;
  `;

  const selectResult = await query(selectQuery, [roomId]);

  const room = selectResult[0];
  return room;
};

/** @description 모든 채팅룸 가져오기 */
export const getAllMyRoom = async (currentUserId: string) => {
  const room = await prisma.chatRoom.findMany({
    where: {
      id: currentUserId,
    },
    include: {
      message: {
        select: {
          sendUser: true,
        },
      },
    },
  });
  return room;
};

/** @description 채팅룸 가져오기 */
export const getMyRoom = async (roomId: string) => {
  const room = await prisma.chatRoom.findUnique({
    where: {
      id: roomId,
    },
  });
  return room;
};

/** @description 메세지 가져오기 */
export const getMyMessages = async (roomId: string) => {
  const message = await prisma.chatMessage.findMany({
    where: {
      roomId,
    },
  });
  return message;
};

/** @description 읽지 않은 메세지 */
export const unreadMessage = async (chatPartnerId: string) => {
  const message = await prisma.chatMessage.findMany({
    where: {
      sendUserId: chatPartnerId,
      isRead: false,
    },
    // orderBy: {createdAt: 'desc'},
  });
  return message;
};

/** @description 읽음 상태 변경 */
export const changeReadStatus = async (messageId: string) => {
  const message = await prisma.chatMessage.update({
    where: {
      id: messageId,
    },
    data: {
      isRead: true,
    },
  });
  return message;
};

/** @description 메세지 삭제 */
export const deleteMessage = async (roomId: string) => {
  const message = await prisma.chatMessage.deleteMany({
    where: {
      roomId,
    },
  });
  return message;
};

/** @description 룸 삭제 */
export const deleteRoom = async (roomId: string) => {
  const room = await prisma.chatRoom.deleteMany({
    where: {
      id: roomId,
    },
  });
  return room;
};
