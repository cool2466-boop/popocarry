import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { api, currentUser, origin, limit, ApiError } from '@/lib/api';
import { imageType } from '@/lib/security';
import { participant } from '@/lib/orders';
import { prisma } from '@/lib/prisma';
export async function POST(req: Request) { return api(async () => {
  origin(req); const user = await currentUser(); limit(`upload:${user!.id}`, 10);
  const max = 5 * 1024 * 1024;
  const length = Number(req.headers.get('content-length'));
  if (!length || length > max + 65536) throw new ApiError(413, '5MB 이하의 파일만 업로드할 수 있습니다.');
  const form = await req.formData(); const file = form.get('file'); const orderId = form.get('orderId');
  if (!(file instanceof File) || typeof orderId !== 'string' || file.size > max) throw new ApiError(400, '업로드 정보를 확인해 주세요.');
  const order = await participant(orderId, user!.id);
  if (order.travelerId !== user!.id || order.status !== 'PAID') throw new ApiError(403, '결제 완료된 거래의 여행자만 업로드할 수 있습니다.');
  const buffer = Buffer.from(await file.arrayBuffer()); const contentType = imageType(buffer);
  if (file.type !== contentType) throw new ApiError(400, '파일 형식이 일치하지 않습니다.');
  const directory = path.resolve(process.env.PRIVATE_UPLOAD_DIR || path.join(process.cwd(), 'storage', 'receipts'));
  await mkdir(directory, { recursive: true }); const filename = randomUUID(); const output = path.join(directory, filename);
  await writeFile(output, buffer, { flag: 'wx' });
  try {
    const asset = await prisma.$transaction(async tx => {
      const asset = await tx.asset.create({ data: { orderId, uploadedBy: user!.id, contentType, path: filename } });
      const changed = await tx.order.updateMany({ where: { id: orderId, travelerId: user!.id, status: 'PAID' }, data: { status: 'PURCHASED', receiptUrl: `/api/assets/${asset.id}` } });
      if (changed.count !== 1) throw new ApiError(409, '거래 단계가 변경되었습니다.');
      return asset;
    }); return { id: asset.id, url: `/api/assets/${asset.id}` };
  } catch (error) { await unlink(output).catch(() => {}); throw error; }
}); }
