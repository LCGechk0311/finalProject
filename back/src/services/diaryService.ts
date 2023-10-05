import { PrismaClient, Prisma } from "@prisma/client";
import { IDiary } from "types/diary";
import { v4 } from "uuid";

const prisma = new PrismaClient();

/**
 * 다이어리 작성
 * @param title
 * @param content
 * @param authorId
 * @returns diary (새롭게 생성된 diary Object)
 */
export const createDiaryService = async (
  authorId: number,
  inputData: Prisma.DiaryCreateInput
) => {
  const diary = await prisma.diary.create({
    data: {
      ...inputData,
      id: v4(),
      author: {
        connect: {
          id: authorId,
        },
      },
    },
    include: {
      author: true,
    },
  });

  return diary;
};

/**
 * 특정 유저의 다이어리 목록 가져오기
 * @param userId
 * @param page
 * @param limit
 * @returns diaries (limit 개수먄큼 반환)
 */
export const getDiaryByUserIdService = async (
  userId: number,
  page: number,
  limit: number
) => {
  const diaries = await prisma.diary.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: { authorId: userId },
  });

  return diaries;
};

/**
 * 다이어리 하나 가져오기
 * @param diaryId
 * @returns
 */
export const getDiaryByDiaryIdService = async (diaryId: string) => {
  const diary = await prisma.diary.findUnique({
    where: { id: diaryId },
  });

  return diary;
};

// 내 친구들의 다이어리 가져오기
export const getFriendsDiaryServcie = async (
  userId: string,
  page: number,
  limit: number
) => {
  // step1. 친구 목록 읽어오기
  // step2. 친구들을 모두 검색하기
  // step3. 친구들의 다이어리 가져오기
  return "이건 친구 다이어리 가져오기입니다. ";
};

// 모든 유저의 다이어리 가져오기
export const getAllDiaryService = async (page: number, limit: number) => {
  const allDiary = await prisma.diary.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  return allDiary;
};

export const updateDiaryService = async (
  diaryId: string,
  inputData: Prisma.DiaryUpdateInput
) => {
  const updatedDiary = await prisma.diary.update({
    where: { id: diaryId },
    data: inputData,
  });

  return updatedDiary;
};

export const deleteDiaryService = async (diaryId: string) => {
  const deletedDiary = await prisma.diary.delete({
    where: { id: diaryId },
  });

  return deletedDiary;
};