import { api, body, currentUser, ApiError } from '@/lib/api';
import { text } from '@/lib/security';
import { prisma } from '@/lib/prisma';
export async function POST(req: Request) { return api(async () => {
  const user = await currentUser(); const b = await body(req);
  return prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: text(b.orderId, 100) } });
    if (!order || order.shopperId !== user!.id) throw new ApiError(404, '주문을 찾을 수 없습니다.');
    if (order.status === 'REFUND_REQUESTED') return { status: 'REFUND_REQUESTED' };
    if (['PENDING','OFFER_MADE'].includes(order.status)) {
      if (await tx.paymentAttempt.findFirst({ where: { orderId: order.id } })) throw new ApiError(409, '결제 시도가 있어 승인 여부를 먼저 확인해야 합니다.');
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } }); return { status: 'CANCELLED' };
    }
    if (!['PAID','PURCHASED','DISPUTED'].includes(order.status)) throw new ApiError(409, '환불 요청을 접수할 수 없는 단계입니다.');
    const reason = text(b.cancelReason, 1000);
    await tx.order.update({ where: { id: order.id }, data: { status: 'REFUND_REQUESTED', deliveryPin: '', pinExpiresAt: null } });
    await tx.chatMessage.create({ data: { orderId: order.id, sender: 'SYSTEM', name: 'PopoCarry', text: `환불 검토 요청: ${reason}. 환불은 아직 실행되지 않았습니다.`, time: '' } });
    return { status: 'REFUND_REQUESTED' };
  });
}); }
