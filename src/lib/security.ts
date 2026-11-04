import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function text(value: unknown, max = 200, required = true): string {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new ApiError(400, '입력값을 확인해 주세요.');
  return value.trim();
}
export function money(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 10000000) throw new ApiError(400, '금액은 0~10,000,000원 사이의 정수여야 합니다.');
  return value;
}
export function total(price: number, reward: number) { return price + reward + Math.round((price + reward) * 0.08); }
export function date(value: unknown): string {
  const s = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s || s < new Date().toISOString().slice(0, 10)) throw new ApiError(400, '유효한 예정일을 입력해 주세요.');
  return s;
}
export function safeUrl(value: unknown): string {
  if (!value) return '';
  const s = text(value, 2000);
  try { const u = new URL(s); if (u.protocol !== 'https:' || u.username || u.password) throw new Error(); return u.href; } catch { throw new ApiError(400, 'HTTPS 주소를 입력해 주세요.'); }
}
export function pinKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new ApiError(503, '서버 인증 설정이 필요합니다.');
  return createHash('sha256').update(`popocarry-delivery:${secret}`).digest();
}
export function newPin() {
  const pin = randomInt(0, 10000).toString().padStart(4, '0');
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', pinKey(), iv);
  const data = Buffer.concat([cipher.update(pin, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}
export function readPin(value: string) {
  if (!value.startsWith('v1.')) throw new ApiError(409, '이전 거래의 수령 확인은 운영자 확인이 필요합니다.');
  const [, iv, tag, data] = value.split('.');
  const decipher = createDecipheriv('aes-256-gcm', pinKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
export function imageType(buffer: Buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new ApiError(400, 'JPG, PNG, WebP 이미지 파일만 허용됩니다.');
}
