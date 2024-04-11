import { Response, NextFunction } from 'express';
import { fileUploadMiddleware } from './fileMiddleware';

import { CustomFile, FileObjects } from '../types/upload';
import { emptyApiResponseDTO } from '../utils/emptyResult';
import { prisma } from '../../prisma/prismaClient';
import { generateError } from '../utils/errorGenerator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IRequest } from 'types/request';

const handleFileUpload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
  type: 'profile' | 'diary' | 'postDiary',
) => {
  try {
    /**
     * transaction을 제대로 해주려면 dairyCreate 부분에서 upload를 해줘야할 것 같다.
     */
    await prisma.$transaction(async () => {
      fileUploadMiddleware(req, res, async (err: any) => {
        try {
          if (err instanceof multer.MulterError) {
            generateError(400, 'upload error');
          } else if (err) {
            generateError(500, 'Internal server error');
          }

          const files: FileObjects[] = req.files
            ? ([] as FileObjects[]).concat(...Object.values(req.files))
            : [];

          if (type === 'profile' || type === 'postDiary') {
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

          const filePaths = files.map((file) => `fileUpload/${file.filename}`);

          if (type === 'profile') {
            if (req.files) {
              const { userId } = req.params;
              const foundUser = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                  profileImage: true,
                },
              });
              await prisma.fileUpload.deleteMany({
                where: {
                  userId: userId,
                },
              });

              if (!foundUser) {
                const response = emptyApiResponseDTO();
                return response;
              }
              const fileUploadCount = await prisma.fileUpload.count({
                where: {
                  userId,
                },
              });

              if (fileUploadCount >= 2) {
                throw new Error('최대 1개의 파일만 허용됩니다.');
              }

              const oldFiles = foundUser.profileImage;

              if (oldFiles) {
                oldFiles.forEach(async (file) => {
                  const filenameToDelete = file.url.replace('fileUpload/', '');
                  const filePathToDelete = path.join(
                    './fileUpload',
                    filenameToDelete,
                  );
                  fs.unlink(filePathToDelete, async (err) => {
                    if (err) {
                      console.error('Error deleting old file:', err);
                      next(err);
                    }
                  });
                });
              }

              const profileImage = filePaths.map((filename) => ({
                url: filename,
                userId: userId,
              }));

              await prisma.fileUpload.createMany({
                data: profileImage,
              });
            }
          } else if (type === 'diary') {
            const { diaryId } = req.params;

            // 삭제할 데이터가 있을시
            if (req.body.deleteData) {
              const urlsToDelete = req.body.deleteData;

              await prisma.diaryFileUpload.deleteMany({
                where: {
                  url: {
                    in: urlsToDelete,
                  },
                },
              });

              // Delete files from disk storage
              urlsToDelete.forEach(async (url: string) => {
                const filenameToDelete = url.replace('fileUpload/', '');
                const filePathToDelete = path.join(
                  './fileUpload',
                  filenameToDelete,
                );

                fs.unlink(filePathToDelete, async (err) => {
                  if (err) {
                    console.error('Error deleting old file:', err);
                    next(err);
                  }
                });
              });
            }

            if (req.files) {
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

            const fileUploadCount = await prisma.diaryFileUpload.count({
              where: {
                diaryId,
              },
            });

            if (fileUploadCount >= 5) {
              throw new Error('최대 5개의 파일만 허용됩니다.');
            }

            const foundDiary = await prisma.diary.findUnique({
              where: { id: diaryId },
              include: {
                filesUpload: true,
              },
            });

            if (!foundDiary) {
              const response = emptyApiResponseDTO();
              return response;
            }

            const FilesUpload = filePaths.map((filename) => ({
              url: filename,
              diaryId: diaryId,
            }));

            await prisma.diaryFileUpload.createMany({
              data: FilesUpload,
            });
          } else if (type === 'postDiary') {
            const userId = req.user.id;
            const foundDiary = await prisma.user.findUnique({
              where: { id: userId },
            });

            if (!foundDiary) {
              const response = emptyApiResponseDTO();
              return response;
            }

            const FilesUpload = filePaths.map((filename) => ({
              url: filename,
            }));

            await prisma.diaryFileUpload.createMany({
              data: FilesUpload,
            });

            res.locals.myData = [];

            for (const file of files) {
              res.locals.myData.push(`fileUpload/${file.filename}`);
            }
          }
          next();
        } catch (error) {
          next(error);
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

export const fileUpload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  handleFileUpload(req, res, next, 'profile');
};

export const diaryUpload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  handleFileUpload(req, res, next, 'diary');
};

export const postDiaryUpload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  handleFileUpload(req, res, next, 'postDiary');
};

export const s3upload = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  s3FileUpload(req, res, next, 'profile');
};

import aws from 'aws-sdk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../utils/DB';
import multerS3 from 'multer-s3';
dotenv.config();
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: 'ap-northeast-2',
});

const s3 = new aws.S3();

const uploadImagesMulter = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'lcgtestbucket1',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `contents/${Date.now()}_${file.originalname}`);
    },
  }),
}).single('image');

export const profileImageUpload = (
  req: IRequest,
  res: Response,
  next: NextFunction,
) => {
  uploadImagesMulter(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError) {
        generateError(400, 'upload error');
      } else if (err) {
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
      next(err);
    }
  });
};
const upload = multer({
  storage: multer.memoryStorage(),
}).array('filesUpload', 5);
const s3FileUpload = (
  req: IRequest,
  res: Response,
  next: NextFunction,
  type: 'profile' | 'diary' | 'postDiary',
) => {
  upload(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError) {
        generateError(400, 'upload error');
      } else if (err) {
        generateError(500, 'Internal server error');
      }

      const files: FileObjects[] = req.files
        ? ([] as FileObjects[]).concat(...Object.values(req.files))
        : [];
      if (type === 'profile' || type === 'postDiary') {
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

      const filePaths = files.map((file) => ({
        filename: uuidv4() + '-' + file.originalname,
        buffer: file.buffer,
      }));

      if (type === 'profile') {
        if (files.length >= 2) {
          return res.status(400).send('최대 1개의 파일만 허용됩니다.');
        }

        if (files) {
          // TODO 수정예정
          const userId = req.params.userId;
          const countFileQuery = `SELECT COUNT(*) as totalCount
          FROM fileUpload
          WHERE userId = ?;`;
          const fileUploadInfo = await query(countFileQuery, [userId]);

          const fileQuery = `SELECT fileKey
          FROM fileUpload
          WHERE userId = ?;`;
          const fileUploadInfo2 = await query(fileQuery, [userId]);

          if (fileUploadInfo[0].totalCount > 0) {
            const deleteQuery = `DELETE FROM fileUpload WHERE userId = ?;`;

            await query(deleteQuery, [userId]);
            const fileKeys = fileUploadInfo2.map((row: any) => row.fileKey);
            fileKeys.forEach(async (fileKey: any) => {
              await deleteObjectFromS3(fileKey);
            });
          }

          const profileImage = filePaths.map((fileKey, buffer) => ({
            fileKey: fileKey,
            userId: userId,
            buffer: buffer,
          }));

          const insertQuery = `
  INSERT INTO fileUpload (fileKey, userId)
  VALUES ?;
`;
          const insertValues = profileImage.map((image) => [
            image.fileKey.filename,
            image.userId,
          ]);

          await query(insertQuery, [insertValues]);

          for (const image of profileImage) {
            await putObjectFromS3(image.fileKey.filename, image.fileKey.buffer);
          }
        }
      }
      next();
    } catch (next) {
      next(err);
    }
  });
};

const putObjectFromS3 = async (fileKey: string, file: any) => {
  const buffer = Buffer.from(file.buffer);
  const params = {
    Bucket: 'lcgtestbucket1',
    Key: fileKey,
    Body: buffer,
  };

  try {
    const s3UploadResult = await s3.upload(params).promise();
    console.log(`${s3UploadResult} 111111111111111`);
  } catch (error) {
    console.log(error);
  }
};

const deleteObjectFromS3 = async (fileKey: string) => {
  const params = {
    Bucket: 'lcgtestbucket1',
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`Object with key '${fileKey}' deleted from S3 successfully.`);
  } catch (error) {
    console.error(`Error deleting object from S3: ${error.message}`);
  }
};
