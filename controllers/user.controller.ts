import { Request, Response } from 'express';
import { Document } from 'mongoose';
import { ERROR_MESSAGE, HTTP_STATUS_CODE } from '../utils/const/constants';
import { logger } from '../utils/logger/loggerUtil';
import { GEncryptedKey, UserDocument, UserModel } from '../models/user.model';
import { errorResponse } from '../utils/response/responseUtil';
import { encrypt } from '../utils/crypto/encdecUtil';
import {
  createRefreshToken,
  createAccessToken,
  verifyJwt,
  verifyRJwt,
} from '../utils/jwt/jwtUtil';
import { sendRefreshToken } from '../utils/jwt/sendRefreshToken';
import {
  createUser,
  invalidateJWT,
  validatePassword,
} from '../services/user.service';
import { createUserSchema } from '../schemas/user.schema';

export const registerUserHandler = async (
  req: Request<
    unknown,
    unknown,
    Omit<UserDocument, 'updatedAt' | 'createdAt' | 'comparePassword'>
  >,
  res: Response
): Promise<any> => {
  try {
    const input = JSON.parse(JSON.stringify(req.body));

    if (input.password.length < 6) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json({ message: 'Password length should be at least 6' });
    }
    // user schema validation
    const inputValidation = createUserSchema.safeParse({ body: input });

    // phone_no is now a string
    if (!inputValidation.success) {
      logger.error(
        `Input Validation was - ${
          inputValidation.success
        } | phone_no check failed | ${JSON.stringify(inputValidation)}`
      );
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(errorResponse(JSON.parse(JSON.stringify(inputValidation))));
    }

    // handle uppercase email extensions
    const splitEmail: Array<string> = input.email.split('@');
    splitEmail[1] = splitEmail[1].toLowerCase();
    input.email = splitEmail.join('@');

    const user = (await createUser(input)) as InstanceType<typeof UserModel>;
    // await createDepositAddresses(user._id);

    // if above checks passed, then provide access token for user
    // send refersh token as cookie
    // refresh & access token use different secret refer .env
    const ref_pd_to_encrypt: object = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    const UserRefreshInfo: GEncryptedKey = encrypt(
      JSON.stringify(ref_pd_to_encrypt),
      process.env.ACCESS_TOKEN_SECRET as string
    );
    sendRefreshToken(res, createRefreshToken(UserRefreshInfo));

    // sending access token as response
    const pd_to_encrypt: object = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    // encrypting user info as metadata to be embeded in jwt token payload signature
    const UserInfo: GEncryptedKey = encrypt(
      JSON.stringify(pd_to_encrypt),
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const accessToken = await createAccessToken(UserInfo);

    //{ decoded, expired, valid }
    const { decoded } = await verifyJwt(accessToken);

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      accessToken,
    });
  } catch (error: any) {
    logger.error(error);
    if (error.message.split(' ')[0] === 'E11000') {
      logger.error(error, 'Resource Conflict');
      return res
        .status(HTTP_STATUS_CODE.CONFLICT)
        .json(
          errorResponse(`${error.message.split(' ')[11]} is already in use`)
        );
    }
    if (
      error.message === "Cannot read properties of undefined (reading 'path')"
    ) {
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .json(errorResponse("key should be 'profilePicture' in form-data"));
    }
    if (error.errno === -4058) {
      logger.error("No 'uploads' directory found locally....👀");
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .json(errorResponse(error.message));
    }

    if (error.message.split(' ')[0] === 'ENOENT') {
      return res
        .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
        .json(errorResponse(error.message));
    }
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(errorResponse(error.message));
  }
};

export const loginUserHandler = async (
  req: Request<
    unknown,
    unknown,
    { email: 'string'; password: 'string' },
    unknown
  >,
  res: Response
): Promise<any> => {
  try {
    if (!req.body.email || !req.body.password) {
      logger.error('missing email,password in request body');
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(errorResponse(ERROR_MESSAGE.REQUIRED_PARAMETERS_MISSING));
    }
    const user = await UserModel.findOne({
      email: req.body.email,
    });

    const validPass = await validatePassword(req.body);
    if (!validPass) {
      return res
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json({ message: 'Incorrect Email/Password was provided' });
    }

    // user not found in db
    if (!user) {
      logger.error('user not found in db');
      return res
        .status(HTTP_STATUS_CODE.UNAUTHORIZED)
        .json(errorResponse(`No user exists with ${req.body.email}`));
    }

    // if above checks passed, then provide access token for user
    // send refersh token as cookie
    // refresh & access token use different secret refer .env
    const ref_pd_to_encrypt: object = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    const UserRefreshInfo: GEncryptedKey = encrypt(
      JSON.stringify(ref_pd_to_encrypt),
      process.env.ACCESS_TOKEN_SECRET as string
    );
    sendRefreshToken(res, createRefreshToken(UserRefreshInfo));

    // sending access token as response
    const pd_to_encrypt: object = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    // encrypting user info as metadata to be embeded in jwt token payload signature
    const UserInfo: GEncryptedKey = encrypt(
      JSON.stringify(pd_to_encrypt),
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const accessToken = await createAccessToken(UserInfo);

    // sending access token as response
    return res.status(HTTP_STATUS_CODE.OK).json({
      accessToken: accessToken,
    });
  } catch (error: any) {
    logger.error(error.message);
    if (error.message === "Cannot read property 'isActive' of null") {
      return res
        .status(HTTP_STATUS_CODE.NOT_FOUND)
        .json(errorResponse('No user registered with this email...'));
    }
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
  }
};

export const logoutUserHandler = async (
  req: Request<unknown, unknown, { email: 'string' }, unknown>,
  res: Response
): Promise<any> => {
  if (!req.body.email) {
    return res
      .status(HTTP_STATUS_CODE.FORBIDDEN)
      .json(errorResponse('required payload missing in request body....'));
  }
  if (res.locals.user.userEmail !== req.body.email) {
    return res
      .status(HTTP_STATUS_CODE.UNAUTHORIZED)
      .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
  }
  const currentUser = res.locals.user.userID;
  const ref_token = req.cookies['jid'];
  if (!ref_token) {
    return res
      .status(HTTP_STATUS_CODE.UNAUTHORIZED)
      .json(errorResponse(ERROR_MESSAGE.UNAUTHORIZED));
  }
  try {
    const userD = res.locals.user.data;
    if (!userD) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        message: `User not found with this email:${req.body.email}`,
      });
    }
    // flow
    const ref_token_decoded = await verifyRJwt(ref_token);
    // assume they are logged in
    const reso = await invalidateJWT(
      { _id: currentUser },
      { $inc: { tokenVersion: 1 } }
    );
    if (reso?.tokenVersion === ref_token_decoded.decoded.tokenVersion) {
      logger.warn(
        `${req.body.email} was not logged out...DB update could not happen`
      );
      return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
        message: `User with email:${req.body.email} logout failed`,
        loggedOut: false,
      });
    }
    return res.status(200).json({
      message: `${res.locals.user.userEmail} successfully logged out`,
      user: res.locals.user.userEmail,
      loggedOut: true,
    });
  } catch (error: any) {
    logger.error(error.message);
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(errorResponse(ERROR_MESSAGE.INTERNAL_SERVER_ERROR));
  }
};

export const socialLoginHandler = async (
  req: Request<
    unknown,
    unknown,
    { email: string; name: string; provider: string }
  >,
  res: Response
): Promise<Response> => {
  try {
    const { email, name, provider } = req.body;

    // Validate input fields
    if (!email || !name || !provider) {
      return res
        .status(HTTP_STATUS_CODE.BAD_REQUEST)
        .json(
          errorResponse('Missing required fields: email, name, or provider')
        );
    }

    // Normalize email to handle uppercase extensions
    const normalizedEmail = normalizeEmail(email);

    // Check if the user already exists
    let user = (await UserModel.findOne({
      email: normalizedEmail,
    })) as UserDocument;

    if (!user) {
      // Create a new user for social login
      user = await createUser({
        email: normalizedEmail,
        name,
        provider,
        password: '', // Password is not required for social login
      });

      logger.info(`New user created via ${provider} login: ${user.email}`);
    }

    // Refresh token payload
    const refreshPayload = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    const encryptedRefreshPayload: GEncryptedKey = encrypt(
      JSON.stringify(refreshPayload),
      process.env.REFRESH_TOKEN_SECRET as string
    );
    sendRefreshToken(res, createRefreshToken(encryptedRefreshPayload));

    // Access token payload
    const accessPayload = {
      userID: user._id,
      userEmail: user.email,
      tokenVersion: user.tokenVersion,
    };
    const encryptedAccessPayload: GEncryptedKey = encrypt(
      JSON.stringify(accessPayload),
      process.env.ACCESS_TOKEN_SECRET as string
    );
    const accessToken = await createAccessToken(encryptedAccessPayload);

    // Verify JWT for debugging (if needed)
    //   const { decoded } = verifyJwt(accessToken);
    verifyJwt(accessToken);

    // Return response with access token
    return res.status(HTTP_STATUS_CODE.OK).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    });
  } catch (error: any) {
    logger.error(error);

    // Handle specific errors
    if (error.message?.includes('E11000')) {
      const field = Object.keys(error.keyValue)[0];
      return res
        .status(HTTP_STATUS_CODE.CONFLICT)
        .json(errorResponse(`${field} is already in use`));
    }

    // Fallback for unhandled errors
    return res
      .status(HTTP_STATUS_CODE.INTERNAL_SERVER)
      .json(errorResponse('Internal server error'));
  }
};

// Utility function to normalize email
const normalizeEmail = (email: string): string => {
  const [localPart, domainPart] = email.split('@');
  return `${localPart}@${domainPart.toLowerCase()}`;
};
