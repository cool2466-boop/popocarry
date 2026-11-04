import bcrypt from 'bcryptjs';
import { api, body, limit, ApiError } from '@/lib/api';
import { text } from '@/lib/security';
import { prisma } from '@/lib/prisma';
export async function POST(req: Request) { return api(async () => {
  limit('register-global', 20, 60000);
  const input = await body(req); const email = text(input.email, 254).toLowerCase(); const name = text(input.name, 60);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, '이메일 주소를 확인해 주세요.');
  if (typeof input.password !== 'string' || input.password.length < 12 || Buffer.byteLength(input.password) > 72) throw new ApiError(400, '비밀번호는 12자 이상, UTF-8 기준 72바이트 이하여야 합니다.');
  const password = await bcrypt.hash(input.password, 12);
  if (await prisma.user.findUnique({ where: { email } })) throw new ApiError(409, '이 이메일로 가입할 수 없습니다. 기존 계정 로그인을 확인해 주세요.');
  await prisma.user.create({ data: { email, name, password } }); return { registered: true };
}); }
