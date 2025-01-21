import { omit } from 'lodash';
import { Document, FilterQuery } from 'mongoose'; // Import Document from mongoose
import { logger } from '../utils/logger/loggerUtil';
import { UserDocument, UserModel } from '../models/user.model';

// creates & stores new user in DB
// export async function createUser(
//   input: Omit<UserDocument, 'updatedAt' | 'createdAt' | 'comparePassword'> // Omit fields from UserDocument
// ) {
//   try {
//     const userWithEmailExists = await UserModel.exists({
//       email: input.email,
//     });
//     if (userWithEmailExists) {
//       throw new Error(`Email already exists`);
//     }
//     const user = await new UserModel(input);
//     await user.save();
//     return omit(user.toJSON(), 'password');
//   } catch (error: any) {
//     throw error;
//   }
// }

export const createUser = async (
  input: Partial<UserDocument>
): Promise<UserDocument> => {
  const user = await UserModel.create(input);
  return user.toObject();
};

export async function validatePassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const user = await UserModel.findOne({
      email: `${email}`,
    }).select('email password');

    // user not found in db
    if (!user) {
      logger.error('user not found in db');
      return false;
    }

    // compare candidate password with stored password
    const isValid = await user.comparePassword(password);

    // password is wrong
    if (!isValid) {
      return false;
    }
    // everything is sorted
    return omit(user.toJSON(), 'password');
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
}

export const invalidateJWT = async (query: any, inc: any) => {
  try {
    return await UserModel.findOneAndUpdate(query, inc, {
      new: true,
    });
  } catch (error: any) {
    logger.error(error);
    throw error;
  }
};
