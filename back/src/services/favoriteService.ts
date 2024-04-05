import { query } from '../utils/DB';

// 좋아요 눌렀는지 조회
export async function searchFavorite(diary_id: string, user_id: string) {

  const sql = `
      SELECT * FROM favorite
      WHERE diaryId = ? AND userId = ?;
    `;
  const values = [diary_id, user_id];

  const favorite = await query(sql, values);

  return favorite;
}

// 좋아요 누르기
export async function addFavorite(diary_id: string, user_id: string) {

  const addFavoriteSql = `
      INSERT INTO favorite (diaryId, userId)
      VALUES (?, ?);
    `;

  await query(addFavoriteSql, [diary_id, user_id]);
  //count 추가
  const favoriteCount = await countFavoriteByDiaryId(diary_id);

  const updateDiarySql = `
      UPDATE diary
      SET favoriteCount = ?
      WHERE id = ?;
    `;

  await query(updateDiarySql, [favoriteCount, diary_id]);
}

// 좋아요 취소
export async function deleteFavorite(diary_id: string, user_id: string) {

  const deleteFavoriteSql = `
      DELETE FROM favorite
      WHERE diaryId = ? AND userId = ?;
    `;

  await query(deleteFavoriteSql, [diary_id, user_id]);

  //count 삭제
  const favoriteCount = await countFavoriteByDiaryId(diary_id);

  const updateDiarySql = `
      UPDATE diary
      SET favoriteCount = ?
      WHERE id = ?;
    `;

  await query(updateDiarySql, [favoriteCount, diary_id]);
}

// 좋아요 횟수 체크
export const countFavoriteByDiaryId = async (diaryId: string) => {
  const countFavoritesSql = `
      SELECT COUNT(*) AS count FROM favorite
      WHERE diaryId = ?;
    `;

  const result = await query(countFavoritesSql, [diaryId]);

  const count = result[0].count;

  return count;
};
