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
  console.log(1);
  console.log(tableName);
  const countQuery = `
    SELECT COUNT(*) FROM ? WHERE ?;
  `;
  const countResult = await query(countQuery, [tableName, where]);
  console.log(countResult);

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
