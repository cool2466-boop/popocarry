import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { ApiError } from './security';
export { ApiError } from './security';
const buckets = new Map<string, { count: number; expires: number }>();
export function limit(key: string, max = 60, windowMs = 60000) {
  const now = Date.now(); let bucket = buckets.get(key);
  if (!bucket || bucket.expires < now) bucket = { count: 0, expires: now + windowMs };
  bucket.count++; buckets.set(key, bucket);
  if (buckets.size > 10000) for (const [k, b] of buckets) if (b.expires < now) buckets.delete(k);
  if (bucket.count > max) throw new ApiError(429, '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
}
export function origin(req: Request) {
  const expected = new URL(process.env.APP_URL || process.env.NEXTAUTH_URL || req.url).origin;
  if (req.headers.get('origin') !== expected) throw new ApiError(403, '허용되지 않은 요청 출처입니다.');
}
export async function body(req: Request): Promise<Record<string, unknown>> {
  origin(req);
  if (!req.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415, 'JSON 요청이 필요합니다.');
  if (Number(req.headers.get('content-length') || 0) > 32768) throw new ApiError(413, '요청이 너무 큽니다.');
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, '본문이 필요합니다.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 32768) { await reader.cancel(); throw new ApiError(413, '요청이 너무 큽니다.'); }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed; } catch { throw new ApiError(400, '잘못된 요청입니다.'); }
}
export async function currentUser(required = true) {
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) throw new ApiError(503, '인증 설정이 필요합니다.');
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  const user = id ? await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } }) : null;
  if (!user && required) throw new ApiError(401, '로그인해 주세요.');
  return user;
}
export async function api(run: () => Promise<unknown>) {
  try { return NextResponse.json({ success: true, data: await run() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    console.error('API request failed', error instanceof Error ? error.name : 'Unknown');
    return NextResponse.json({ success: false, error: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
