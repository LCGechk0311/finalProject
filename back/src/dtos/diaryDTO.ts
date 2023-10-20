// user.dto.ts
import {
  IsString,
  IsDate,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import 'reflect-metadata';

export class ApiResponseDTO {
  data: any;
  message: string;
  status: number;

  constructor(status: number, data: any, message: string) {
    this.data = data;
    this.message = message;
    this.status = status;
  }
}

export class PaginationResponseDTO extends ApiResponseDTO {
  pageInfo: any;

  constructor(status: number, data: any, pageInfo: any, message: string) {
    super(status, data, message);
    this.pageInfo = pageInfo;
  }
}
export class AuthorInDiaryDTO {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  profileImage: string;
}

// exclude 사용해주기
export class DiaryResponseDTO {
  @Expose()
  id: string;

  @Expose()
  authorId: string;

  @Expose()
  createdDate: Date;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  is_public: string;

  @Expose()
  emoji: string;

  @Expose()
  emotion: string;

  @Expose()
  favoriteCount: number;

  @Expose()
  @Type(() => AuthorInDiaryDTO)
  author: AuthorInDiaryDTO;
}

export class DiaryValidateDTO {
  @Type(() => Date)
  @IsDate()
  createdDate?: Date;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString({ message: '문자 입력 해주세요' })
  is_public: string;
}