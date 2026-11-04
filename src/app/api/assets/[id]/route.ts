import { readFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { currentUser, ApiError } from '@/lib/api';
import { participant } from '@/lib/orders';
import { prisma } from '@/lib/prisma';
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const user = await currentUser(); const asset = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!asset) throw new ApiError(404, '파일을 찾을 수 없습니다.');
    await participant(asset.orderId, user!.id);
    const base = path.resolve(process.env.PRIVATE_UPLOAD_DIR || path.join(process.cwd(), 'storage', 'receipts'));
    const filename = path.resolve(base, asset.path);
    if (path.dirname(filename) !== base) throw new ApiError(404, '파일을 찾을 수 없습니다.');
    const bytes = await readFile(filename);
    return new NextResponse(bytes, { headers: { 'Content-Type': asset.contentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
  } catch (error) { return NextResponse.json({ error: '파일에 접근할 수 없습니다.' }, { status: error instanceof ApiError ? error.status : 500 }); }
}
