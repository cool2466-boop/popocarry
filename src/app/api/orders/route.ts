import { api, body, currentUser, limit, ApiError } from '@/lib/api';
import { text, money, date, safeUrl } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { publicOrderFields } from '@/lib/orders';
export async function GET(req: Request) { return api(async () => {
  const url = new URL(req.url); const mine = url.searchParams.get('mine') === '1';
  const user = mine ? await currentUser() : null;
  const q = (url.searchParams.get('q') || '').slice(0, 100);
  return prisma.order.findMany({ where: { shopperId: { not: null }, ...(mine ? { OR: [{ shopperId: user!.id }, { travelerId: user!.id }, { offers: { some: { travelerId: user!.id } } }] } : { status: 'PENDING' }), ...(q ? { AND: [{ OR: [{ titleKo: { contains: q } }, { originKo: { contains: q } }, { destKo: { contains: q } }] }] } : {}) }, select: publicOrderFields, orderBy: { createdAt: 'desc' }, take: 100 });
}); }
export async function POST(req: Request) { return api(async () => {
  const user = await currentUser(); limit(`order:${user!.id}`, 10); const b = await body(req);
  const title = text(b.titleKo, 150), originKo = text(b.originKo, 100), destKo = text(b.destKo, 100);
  const quantity = money(b.quantity); if (quantity < 1 || quantity > 100) throw new ApiError(400, '수량은 1~100개로 입력해 주세요.');
  const price = money(b.priceKrw); if (!price) throw new ApiError(400, '상품 원가를 입력해 주세요.');
  return prisma.order.create({ data: { titleKo: title, titleEn: title, originKo, originEn: originKo, destKo, destEn: destKo, originFlag: typeof b.originFlag === 'string' ? text(b.originFlag, 12, false) : '', imageUrl: safeUrl(b.imageUrl), productUrl: safeUrl(b.productUrl), quantity, options: text(b.options, 500, false), wantedDate: date(b.wantedDate), priceKrw: price, rewardKrw: money(b.rewardKrw), storeKo: text(b.storeKo, 200), storeEn: '', categoryKo: text(b.categoryKo, 50), categoryEn: '', shopperId: user!.id }, select: publicOrderFields });
}); }
export async function PATCH() { return api(async () => { throw new ApiError(405, '거래별 동작 API를 이용해 주세요.'); }); }

