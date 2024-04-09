import { IsString, IsOptional } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import 'reflect-metadata';
import { fileUpload } from '../types/user';

export class ApiResponseDTO<T> {
  data: T;
  message: string;
  status: number;

  constructor(status: number, data: T, message: string) {
    this.data = data;
    this.message = message;
    this.status = status;
  }
}

export class userResponseDTO {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  description: string | null;

  @Expose()
  profileImage: fileUpload[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  latestEmoji : string;

  @Expose()
  status? : boolean;
}

export class userValidateDTO {
  @IsString()
  email: string;

  @IsString()
  username: string;

  @IsString()
  password: string;
}

export class userUpdateValidateDTO {
  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString({ each: true })
  profileImage: fileUpload[];
}
