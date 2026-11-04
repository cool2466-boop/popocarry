import { api, body, currentUser, limit, ApiError } from '@/lib/api';
import { text, money, date, readPin } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { publicOrderFields } from '@/lib/orders';
import { timingSafeEqual } from 'crypto';
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, context: Context) { const params = await context.params; return api(async () => {
  const user = await currentUser(); const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order?.shopperId) throw new ApiError(404, '주문을 찾을 수 없습니다.');
  const buyer = user!.id === order.shopperId, traveler = user!.id === order.travelerId;
  const ownOffer = await prisma.offer.findUnique({ where: { orderId_travelerId: { orderId: order.id, travelerId: user!.id } } });
  if (!buyer && !traveler && !ownOffer && order.status !== 'PENDING') throw new ApiError(404, '주문을 찾을 수 없습니다.');
  const info = await prisma.order.findUnique({ where: { id: order.id }, select: publicOrderFields });
  return { ...info, role: buyer ? 'BUYER' : traveler ? 'TRAVELER' : 'VISITOR', travelerName: buyer || traveler ? order.travelerName : null,
    arrivalDate: order.arrivalDate, offers: await prisma.offer.findMany({ where: { orderId: order.id, ...(!buyer ? { travelerId: user!.id } : {}) }, select: { id: true, travelerName: true, rewardKrw: true, arrivalDate: true, status: true } }),
    chatMessages: buyer || traveler ? (await prisma.chatMessage.findMany({ where: { orderId: order.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 200, select: { id: true, sender: true, name: true, text: true, createdAt: true } })).reverse() : [],
    receiptUrl: buyer || traveler ? order.receiptUrl : null,
    deliveryPin: buyer && order.status === 'PURCHASED' && order.pinExpiresAt && order.pinExpiresAt > new Date() && order.pinFailures < 5 ? readPin(order.deliveryPin) : null,
  };
}); }
export async function POST(req: Request, context: Context) { const params = await context.params; return api(async () => {
  const user = await currentUser(); const b = await body(req); limit(`action:${user!.id}`, 30);
  const action = text(b.action, 30);
  // Serializable SQLite transaction: authorization and transition are one operation.
  const result = await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id: params.id } });
    if (!order?.shopperId) throw new ApiError(404, '주문을 찾을 수 없습니다.');
    const buyer = user!.id === order.shopperId, traveler = user!.id === order.travelerId;
    if (action === 'offer') {
      if (buyer || order.status !== 'PENDING') throw new ApiError(409, '이 주문에는 제안할 수 없습니다.');
      const rewardKrw = money(b.rewardKrw), arrivalDate = date(b.arrivalDate);
      if (order.wantedDate && arrivalDate > order.wantedDate) throw new ApiError(400, '희망 수령일 이전의 일정을 입력해 주세요.');
      return tx.offer.upsert({ where: { orderId_travelerId: { orderId: order.id, travelerId: user!.id } }, create: { orderId: order.id, travelerId: user!.id, travelerName: user!.name || '여행자', rewardKrw, arrivalDate }, update: { rewardKrw, arrivalDate, status: 'PENDING' }, select: { id: true } });
    }
    if (action === 'accept') {
      if (!buyer || order.status !== 'PENDING') throw new ApiError(409, '제안을 수락할 수 없습니다.');
      const offer = await tx.offer.findFirst({ where: { id: text(b.offerId, 100), orderId: order.id, status: 'PENDING' } });
      if (!offer) throw new ApiError(404, '제안을 찾을 수 없습니다.');
      await tx.offer.updateMany({ where: { orderId: order.id }, data: { status: 'DECLINED' } });
      await tx.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } });
      await tx.order.update({ where: { id: order.id }, data: { status: 'OFFER_MADE', travelerId: offer.travelerId, travelerName: offer.travelerName, rewardKrw: offer.rewardKrw, arrivalDate: offer.arrivalDate } });
      return { accepted: true };
    }
    if (action === 'withdraw') {
      if (order.status !== 'PENDING') throw new ApiError(409, '수락된 제안은 철회할 수 없습니다.');
      await tx.offer.updateMany({ where: { orderId: order.id, travelerId: user!.id, status: 'PENDING' }, data: { status: 'WITHDRAWN' } }); return { withdrawn: true };
    }
    if (!buyer && !traveler) throw new ApiError(403, '거래 참여자만 사용할 수 있습니다.');
    if (action === 'verify-pin') {
      if (!traveler || order.status !== 'PURCHASED') throw new ApiError(409, '전달 확인 단계가 아닙니다.');
      if (order.pinFailures >= 5 || !order.pinExpiresAt || order.pinExpiresAt < new Date()) throw new ApiError(423, 'PIN이 만료되었거나 잠겼습니다. 운영자 확인이 필요합니다.');
      const pin = text(b.pin, 4);
      if (!/^\d{4}$/.test(pin)) throw new ApiError(400, '4자리 숫자를 입력해 주세요.');
      if (!timingSafeEqual(Buffer.from(pin), Buffer.from(readPin(order.deliveryPin)))) {
        await tx.order.update({ where: { id: order.id }, data: { pinFailures: { increment: 1 } } });
        return { pinRejected: true };
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'PAYOUT_PENDING', deliveryPin: '', pinExpiresAt: null } });
      await tx.chatMessage.create({ data: { orderId: order.id, sender: 'SYSTEM', name: 'PopoCarry', text: '수령 확인 완료. 지급대행 연동 전으로 정산 대기 중입니다. 송금은 실행되지 않았습니다.', time: '' } });
      return { status: 'PAYOUT_PENDING' };
    }
    if (action === 'dispute') {
      if (!['PAID','PURCHASED','PAYOUT_PENDING'].includes(order.status)) throw new ApiError(409, '문제 신고가 가능한 단계가 아닙니다.');
      const reason = text(b.reason, 1000);
      await tx.order.update({ where: { id: order.id }, data: { status: 'DISPUTED', deliveryPin: '', pinExpiresAt: null } });
      await tx.chatMessage.create({ data: { orderId: order.id, sender: 'SYSTEM', name: 'PopoCarry', text: `문제 신고 접수: ${reason}. 자동 환불은 실행되지 않습니다.`, time: '' } }); return { reported: true };
    }
    throw new ApiError(400, '지원하지 않는 동작입니다.');
  });
  if ('pinRejected' in result) throw new ApiError(400, 'PIN이 일치하지 않습니다. 5회 실패 시 잠깁니다.');
  return result;
}); }
