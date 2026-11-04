import { prisma } from './prisma';
import { ApiError } from './security';
export async function participant(id: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || (order.shopperId !== userId && order.travelerId !== userId)) throw new ApiError(404, '거래를 찾을 수 없습니다.');
  return order;
}
export const publicOrderFields = {
  id: true, titleKo: true, originKo: true, destKo: true, priceKrw: true, rewardKrw: true,
  quantity: true, options: true, wantedDate: true, categoryKo: true, storeKo: true,
  productUrl: true, status: true, createdAt: true, imageUrl: true, originFlag: true, titleEn: true, originEn: true, destEn: true, categoryEn: true, storeEn: true,
} as const;

