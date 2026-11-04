import { api, body, currentUser, limit, ApiError } from '@/lib/api';
import { text, money, total, newPin } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { toss, tossConfig } from '@/lib/toss';
export async function POST(req: Request) { return api(async () => {
  const user = await currentUser(); const b = await body(req); limit(`confirm:${user!.id}`, 20);
  tossConfig();
  const id = text(b.orderId, 64), paymentKey = text(b.paymentKey, 200), amount = money(b.amount);
  const attempt = await prisma.paymentAttempt.findUnique({ where: { id }, include: { order: true } });
  if (!attempt || attempt.userId !== user!.id || attempt.order.shopperId !== user!.id) throw new ApiError(404, '결제 요청을 찾을 수 없습니다.');
  if (attempt.amount !== amount || amount !== total(attempt.order.priceKrw, attempt.order.rewardKrw) || (attempt.paymentKey && attempt.paymentKey !== paymentKey)) throw new ApiError(400, '결제 정보가 일치하지 않습니다.');
  if (attempt.state === 'DONE') return { orderId: attempt.orderId, status: attempt.order.status };
  if (attempt.state === 'FAILED') throw new ApiError(409, '종료된 결제입니다. 거래실에서 새 결제를 시작해 주세요.');
  if (attempt.order.status !== 'OFFER_MADE') throw new ApiError(409, '결제 상태를 확인해 주세요.');
  const cutoff = new Date(Date.now() - 30000);
  const claimed = await prisma.paymentAttempt.updateMany({ where: { id, OR: [{ state: 'READY' }, { state: 'PROCESSING', updatedAt: { lt: cutoff } }] }, data: { state: 'PROCESSING', paymentKey, updatedAt: new Date() } });
  if (claimed.count !== 1) throw new ApiError(409, '결제를 확인 중입니다. 30초 후 재확인해 주세요.');
  // On retry query the provider first: a network/DB failure may have followed an approval.
  let payment;
  if (attempt.state === 'PROCESSING') {
    payment = await toss(`/${encodeURIComponent(paymentKey)}`, 'GET');
    if (payment.status === 'IN_PROGRESS') payment = await toss('/confirm', 'POST', { paymentKey, orderId: id, amount }, id);
  } else payment = await toss('/confirm', 'POST', { paymentKey, orderId: id, amount }, id);
  if (payment.paymentKey === paymentKey && payment.orderId === id && payment.totalAmount === amount && payment.currency === 'KRW' && ['ABORTED', 'EXPIRED'].includes(payment.status)) {
    await prisma.paymentAttempt.updateMany({ where: { id, state: 'PROCESSING', paymentKey }, data: { state: 'FAILED' } });
    throw new ApiError(409, '실패 또는 만료된 결제입니다. 거래실에서 다시 결제해 주세요.');
  }
  if (payment.paymentKey !== paymentKey || payment.orderId !== id || payment.totalAmount !== amount || payment.currency !== 'KRW' || payment.status !== 'DONE') throw new ApiError(409, '공급자 결제 내역과 주문이 일치하지 않습니다. 운영자 확인이 필요합니다.');
  await prisma.$transaction(async tx => {
    const fresh = await tx.paymentAttempt.findUnique({ where: { id } });
    if (fresh?.state === 'DONE') return;
    const changed = await tx.order.updateMany({ where: { id: attempt.orderId, status: 'OFFER_MADE' }, data: { status: 'PAID', deliveryPin: newPin(), pinFailures: 0, pinExpiresAt: new Date(Date.now() + 30 * 86400000) } });
    if (changed.count !== 1) throw new ApiError(409, '결제는 승인되었으나 거래 상태 확인이 필요합니다.');
    await tx.paymentTransaction.create({ data: { orderId: attempt.orderId, paymentKey, type: 'TOSS_PAYMENT', amount, method: payment.method || '카드', status: 'PAID_TEST' } });
    await tx.paymentAttempt.update({ where: { id }, data: { state: 'DONE' } });
  });
  return { orderId: attempt.orderId, status: 'PAID', testMode: true };
}); }
