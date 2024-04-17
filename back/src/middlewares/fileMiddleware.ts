import multer from 'multer';
import multerS3 from 'multer-s3';
import aws from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: 'ap-northeast-2',
});

const s3 = new aws.S3();

// 단일 업로드
export const uploadImagesMulter = multer({
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

// 멀티 업로드
export const uploadMultiMulter = multer({
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
}).array('filesUpload', 5);

// s3 파일 삭제
export const deleteObjectFromS3 = async (fileKey: string) => {
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
