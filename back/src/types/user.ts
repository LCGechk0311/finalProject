export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  description?: string | null;
  profile?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface fileUpload {
  id?: number;
  url?: string;
  userId?: string;
  createdAt?: Date;
}
