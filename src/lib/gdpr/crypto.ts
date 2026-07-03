import * as crypto from 'node:crypto';

const algorithm = 'aes-256-gcm';

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? 'dev-only-32-byte-key-change-before-prod';
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptPlaintext(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64url')).join('.');
}

export function decryptCiphertext(value: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = value.split('.');
  const decipher = crypto.createDecipheriv(algorithm, key(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
}
