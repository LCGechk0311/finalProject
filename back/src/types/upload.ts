interface FileObjects {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  buffer: Buffer;
  location: string;
  fileKey: string;
  filename: string;
  path: string;
  bucket: string;
  key: string;
  acl: string;
  contentType: string;
  contentDisposition: string;
  contentEncoding: string;
  storageClass: string;
  serverSideEncryption: string;
  metadata: string;
  etag: string;
  versionId: string;
}

interface CustomFile extends Express.Multer.File {
  location: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  acl: string;
  contentType: string;
  contentDisposition: string;
  contentEncoding: string;
  storageClass: string;
  serverSideEncryption: string;
  metadata: string;
  etag: string;
  versionId: string;
}

declare module 'express' {
  interface Request {
    file: CustomFile | undefined;
  }
}

export { FileObjects, CustomFile };
