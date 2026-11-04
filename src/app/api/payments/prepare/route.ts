import { api, body, currentUser, limit, ApiError } from '@/lib/api';
import { text, total } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { tossConfig } from '@/lib/toss';
export async function POST(req: Request) { return api(async () => {
  const user = await currentUser(); const b = await body(req); limit(`pay:${user!.id}`, 10);
  const { client } = tossConfig();
  return prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: text(b.orderId, 100) } });
    if (!order || order.shopperId !== user!.id) throw new ApiError(404, '주문을 찾을 수 없습니다.');
    if (order.status !== 'OFFER_MADE' || !order.travelerId) throw new ApiError(409, '결제할 수 있는 단계가 아닙니다.');
    const pending = await tx.paymentAttempt.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } });
    if (pending && !['READY', 'FAILED'].includes(pending.state)) throw new ApiError(409, '이미 진행 중인 결제 확인을 먼저 완료해 주세요.');
    const attempt = (pending?.state === 'READY' ? pending : null) || await tx.paymentAttempt.create({ data: { orderId: order.id, userId: user!.id, amount: total(order.priceKrw, order.rewardKrw) } });
    return { orderId: attempt.id, amount: attempt.amount, orderName: order.titleKo.slice(0, 100), clientKey: client, mode: 'test' };
  });
}); }
