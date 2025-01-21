import { Schema, Document, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

export interface GEncryptedKey {
  iv: string;
  content: string;
}

// reasons counter
interface flReasonCounter {
  wrong_pass: number;
  max_attempts_exceeded: number;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  provider?: string;
  tokenVersion?: number;
  termTokenVersion?: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(userPassword: string): Promise<boolean>;
}

//  Users Schema
export const usersSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    provider: { type: String, default: 'local' }, // 'local', 'google', 'facebook', etc.
    tokenVersion: { type: Number, default: 0, unique: false },
    termTokenVersion: { type: Number, default: 0, unique: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

// Pre-hook to save and store hashed passwords in DB
usersSchema.pre('save', async function (next) {
  const user = this as UserDocument;

  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.saltWorkFactor as string)
    );
    const hash = await bcrypt.hashSync(user.password, salt);
    user.password = hash;
  }

  return next();
});
// Mongoose instance method
usersSchema.methods.comparePassword = async function (
  userPassword: string
): Promise<boolean> {
  const user = this as UserDocument;

  return bcrypt.compare(userPassword, user.password).catch(() => false);
};

export const UserModel = model<UserDocument>('User', usersSchema);
