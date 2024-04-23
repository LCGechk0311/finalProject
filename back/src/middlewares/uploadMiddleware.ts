import { Response, NextFunction } from 'express';
import { FileObjects } from '../types/upload';
import { generateError } from '../utils/errorGenerator';
import multer from 'multer';
import { IRequest } from 'types/request';
import { query } from '../utils/DB';
import {
  deleteObjectFromS3,
  uploadImagesMulter,
  uploadMultiMulter,
} from './fileMiddleware';

export const postDiaryUpload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  s3FileUpload(req, res, next, 'postDiary');
};

export const s3upload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  s3FileUpload(req, res, next, 'diary');
};

export const profileImageUpload = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  uploadImagesMulter(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError) {
        console.log(err);
        generateError(400, 'upload error');
      } else if (err) {
        console.log(err);
        generateError(500, 'Internal server error');
      }
      if (req.file) {
        const { userId } = req.params;

        const isFileQuery = `select profile from user where id = ?;`;

        const isFile = await query(isFileQuery, [userId]);

        if (isFile[0].profile !== null) {
          const parts = isFile[0].profile.split('/');

          const fileKey = 'contents/' + parts[parts.length - 1];

          await deleteObjectFromS3(fileKey);

          const deleteQuery = `UPDATE user
          SET profile = NULL
          WHERE id = ?;`;

          await query(deleteQuery, [userId]);
        }

        const updateFileQuery = `update user set profile = ? where id = ?;`;
        await query(updateFileQuery, [req.file.location, userId]);
      }
      next();
    } catch (err) {
      console.log(err);
      next(err);
    }
  });
};

const s3FileUpload = (
  req: IRequest,
  res: Response,
  next: NextFunction,
  type: 'diary' | 'postDiary',
) => {
  uploadMultiMulter(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError) {
        generateError(400, 'upload error');
      } else if (err) {
        generateError(500, 'Internal server error');
      }

      const files: FileObjects[] = req.files
        ? ([] as FileObjects[]).concat(...Object.values(req.files))
        : [];

      // 서로 다른 타입의 확장자의 파일일 경우 에러 처리
      if (type === 'diary' || type === 'postDiary') {
        if (files.length >= 2) {
          const firstFileType = files[0].mimetype;
          const areAllFilesSameType = files.every(
            (file) => file.mimetype === firstFileType,
          );

          if (!areAllFilesSameType) {
            generateError(400, 'Files have different types');
          }
        }
      }

      if (type === 'diary') {
        if (files.length > 0) {
          const { diaryId } = req.params;
          const countFileQuery = `SELECT COUNT(*) as totalCount
          FROM diaryFileUpload
          WHERE diaryId = ?;`;
          const fileUploadInfo = await query(countFileQuery, [diaryId]);

          const fileQuery = `SELECT url
          FROM diaryFileUpload
          WHERE diaryId = ?;`;
          const fileUploadInfo2 = await query(fileQuery, [diaryId]);

          const fixFiles = fileUploadInfo2.map((row: any) => {
            const parts = row.url.split('/');
            return 'contents/' + parts[parts.length - 1];
          });

          if (fileUploadInfo[0].totalCount > 0) {
            const deleteQuery = `DELETE FROM diaryFileUpload WHERE diaryId = ?;`;

            await query(deleteQuery, [diaryId]);

            fixFiles.forEach(async (fileKey: any) => {
              await deleteObjectFromS3(fileKey);
            });
          }

          const insertQuery = `
  INSERT INTO diaryFileUpload (url, diaryId)
  VALUES ?;
`;
          const insertValues = files.map((file) => [file.location, diaryId]);

          await query(insertQuery, [insertValues]);
        }
      } else if (type === 'postDiary') {
        if (files.length > 0) {
          res.locals.myData = [];

          for (const file of files) {
            res.locals.myData.push(file.location);
          }
        }
      }
      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
};
