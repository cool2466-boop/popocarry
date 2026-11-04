import { api, body, currentUser, limit, ApiError } from '@/lib/api';
import { text } from '@/lib/security';
import { participant } from '@/lib/orders';
import { prisma } from '@/lib/prisma';
export async function POST(req: Request) { return api(async () => {
  const user = await currentUser(); const b = await body(req); limit(`chat:${user!.id}`, 30);
  const order = await participant(text(b.orderId, 100), user!.id);
  if (!order.travelerId) throw new ApiError(409, '여행자 선정 후 대화할 수 있습니다.');
  return prisma.chatMessage.create({ data: { orderId: order.id, sender: order.shopperId === user!.id ? 'BUYER' : 'TRAVELER', name: user!.name || '회원', text: text(b.text, 2000), time: '' }, select: { id: true } });
}); }

export async function GET(req: Request) { return api(async () => {
  const user = await currentUser();
  const params = new URL(req.url).searchParams;
  const order = await participant(text(params.get('orderId'), 100), user!.id);
  const before = params.get('before');
  const cursor = before ? await prisma.chatMessage.findFirst({ where: { id: text(before, 100), orderId: order.id } }) : null;
  if (before && !cursor) throw new ApiError(400, '대화 조회 위치를 확인해 주세요.');
  const rows = await prisma.chatMessage.findMany({
    where: { orderId: order.id, ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}) },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 51,
    select: { id: true, sender: true, name: true, text: true, createdAt: true },
  });
  return { messages: rows.slice(0, 50).reverse(), hasMore: rows.length > 50 };
}); }
