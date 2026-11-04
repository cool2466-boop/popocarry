import { api, currentUser, ApiError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
export async function GET() { return api(async () => {
  const user = await currentUser(); return prisma.paymentTransaction.findMany({ where: { order: { OR: [{ shopperId: user!.id }, { travelerId: user!.id }] } }, select: { id: true, orderId: true, type: true, amount: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 });
}); }
export async function POST() { return api(async () => { throw new ApiError(405, '거래 내역은 검증된 결제 처리에서만 생성됩니다.'); }); }
