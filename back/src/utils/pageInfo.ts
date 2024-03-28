import { prisma } from '../../prisma/prismaClient';
import { PrismaClient } from '@prisma/client';
import { query } from './DB';
/**
 *
 * @param tableName
 * @param limit
 * @param where
 * @returns
 */
export const calculatePageInfo = async (
  // tableName: keyof PrismaClient,
  tableName: string,
  limit: number,
  where: any,
) => {
  // const totalItem = await (prisma[tableName] as any).count({
  //   where,
  // });
  const countQuery = `
    SELECT COUNT(*) AS totalItem FROM ${tableName} WHERE ${where};
  `;
  const countResult = await query(countQuery);

  const totalItem = countResult[0].totalItem;
  const totalPage = Math.ceil(totalItem / limit);

  return { totalItem, totalPage };
};

export const userCalculatePageInfo = async (limit: number, where: any) => {
  // const totalItem = await prisma.user.count({
  //   where,
  // });

  // const totalPage = Math.ceil(totalItem / limit);

  // return { totalItem, totalPage };
  return calculatePageInfo('user', limit, where);
};

export const calculatePageInfoForFriend = async (limit: number, where: any) => {
  // const totalItem = await prisma.friend.count({
  //   where,
  // });

  // const totalPage = Math.ceil(totalItem / limit);

  // return { totalItem, totalPage };
  return calculatePageInfo('friend', limit, where);
};
