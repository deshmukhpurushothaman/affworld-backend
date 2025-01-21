import { NextFunction, Request, Response } from 'express';
import { ERROR_MESSAGE } from '../utils/const/constants';
import { HTTP_STATUS_CODE } from '../utils/const/constants';
import { UserModel } from '../models/user.model';
import { verifyJwt, verifyRJwt } from '../utils/jwt/jwtUtil';

/**
 * This function is used to authenticate a user.
 * @returns an Express middleware function
 * @examples
 *  authenticate() // access to all authenticated users
 */

const authenticate =
  () =>
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const ref_token = req.cookies['jid'];
    if (!ref_token) {
      return res
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json(ERROR_MESSAGE.CHANGE_BROWSER);
    }

    try {
      const ref_token_decoded = await verifyRJwt(ref_token);
      const token = req.headers.authorization?.split(' ')[1];

      if (!token)
        return res
          .status(HTTP_STATUS_CODE.UNAUTHORIZED)
          .json(ERROR_MESSAGE.MISSING_ADMIN_PK);

      const { decoded, expired, valid } = await verifyJwt(token);
      const brokenURL: any = req.url.split('/');
      const refreshRequest: any = brokenURL.find(
        (itm: any) => itm === 'refreshToken'
      );

      // Expired access token check (excluding refresh token requests)
      if (!refreshRequest) {
        if (expired) {
          return res
            .status(HTTP_STATUS_CODE.EXPIRED_ACCESS_TOKEN)
            .json(ERROR_MESSAGE.EXPIRED_ACCESS_TOKEN);
        }
      }

      if (!valid || !decoded || !decoded.userID) {
        return res
          .status(HTTP_STATUS_CODE.UNAUTHORIZED)
          .json(ERROR_MESSAGE.INVALID_ACCESS_TOKEN);
      }

      // Attach user data to response locals
      res.locals.user = decoded;
      const currentUserData = await UserModel.findById({ _id: decoded.userID });
      res.locals.user.data = currentUserData;

      const refTokenVersion = ref_token_decoded.decoded.tokenVersion;
      // Compare tokenVersion to ensure validity
      if (
        currentUserData?.tokenVersion !== refTokenVersion ||
        currentUserData?.tokenVersion !== decoded.tokenVersion
      ) {
        return res
          .status(HTTP_STATUS_CODE.UNAUTHORIZED)
          .json(ERROR_MESSAGE.UNAUTHORIZED);
      }

      // Proceed to the next middleware if everything is valid
      return next();
    } catch (error) {
      console.error(error);
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .json('User Authentication failed...');
    }
  };

export default authenticate;
