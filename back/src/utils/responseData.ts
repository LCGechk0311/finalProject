import { Response } from 'express';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  expiresIn: number,
) => {
  res.cookie(name, value, {
    httpOnly: true,
    expires: new Date(Date.now() + expiresIn),
  });
};
