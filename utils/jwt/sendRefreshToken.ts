import { Response } from 'express';

export const sendRefreshToken = (res: Response, token: string) => {
  res.cookie('jid', token, {
    // now it can only accesed via request not via javascript(client)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'development' ? true : 'none',
    secure: true,
  });
};
