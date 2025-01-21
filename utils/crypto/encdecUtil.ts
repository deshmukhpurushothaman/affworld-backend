import crypto from 'node:crypto';
import { GEncryptedKey } from '../../models/user.model';
const iv = crypto.randomBytes(16);
/**
 * Encrypt Text
 * @param text -  Text to be Encrypted
 * @param secretKey -  Secret Key used for Encryption
 * @returns
 */
export const encrypt = (text: string, secretKey: string): GEncryptedKey => {
  const key = crypto
    .createHash('sha256')
    .update(String(secretKey))
    .digest('base64')
    .substring(0, 32);

  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
};

/**
 * Decrypt Text
 * @param encryptedText -  Encrypted Text
 * @param secretKey -  Secret Key used for Decryption
 * @returns
 */
export const decrypt = (
  encryptedText: GEncryptedKey,
  secretKey: string
): string => {
  const key = crypto
    .createHash('sha256')
    .update(String(secretKey))
    .digest('base64')
    .substring(0, 32);

  const decipher = crypto.createDecipheriv(
    'aes-256-ctr',
    key,
    Buffer.from(encryptedText.iv, 'hex')
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText.content, 'hex')),
    decipher.final(),
  ]);

  return decrpyted.toString();
};
