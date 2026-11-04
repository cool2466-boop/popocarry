import { api, body, currentUser, ApiError } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { text } from '@/lib/security';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
function accountKey(userId: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new ApiError(503, '인증 설정을 확인해 주세요.');
  return createHash('sha256').update(`payout-account:${userId}:${secret}`).digest();
}
function seal(account: string, id: string) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', accountKey(id), iv);
  const payload = Buffer.concat([cipher.update(account, 'utf8'), cipher.final()]);
  return ['account-v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), payload.toString('base64url')].join('.');
}
function masked(value: string | null, id: string) {
  if (!value) return '';
  // Legacy plaintext is not promoted to a verified payout account.
  if (!value.startsWith('account-v1.')) return '';
  const [,iv,tag,data] = value.split('.');
  const decipher = createDecipheriv('aes-256-gcm', accountKey(id), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const account = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  return `•••• ${account.slice(-4)}`;
}
async function profile(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id:true, name:true, email:true, phone:true, city:true, bio:true, payoutBank:true, payoutAccount:true } });
  if (!user) throw new ApiError(404, '계정을 찾을 수 없습니다.');
  const { payoutAccount, ...safe } = user;
  const [totalOrders,completedDeliveries] = await Promise.all([
    prisma.order.count({ where: { shopperId:id } }),
    prisma.order.count({ where: { travelerId:id, status: { in:['PAYOUT_PENDING','SETTLED'] } } }),
  ]);
  return { ...safe, payoutAccountMasked: masked(payoutAccount,id), totalOrders, completedDeliveries };
}
export async function GET() { return api(async () => { const user=await currentUser(); return profile(user!.id); }); }
export async function POST(req:Request) { return api(async () => {
  const user=await currentUser(); const b=await body(req);
  if(Object.keys(b).some(k=>!['name','phone','city','bio','payoutBank','payoutAccount'].includes(k))) throw new ApiError(400,'수정할 수 없는 항목입니다.');
  const update: {name?:string;phone?:string;city?:string;bio?:string;payoutBank?:string;payoutAccount?:string} = {};
  if ('name' in b) update.name=text(b.name,60);
  if ('phone' in b) update.phone=text(b.phone,30,false);
  if ('city' in b) update.city=text(b.city,100,false);
  if ('bio' in b) update.bio=text(b.bio,1000,false);
  if ('payoutBank' in b || 'payoutAccount' in b) {
    update.payoutBank=text(b.payoutBank,60);
    const account=text(b.payoutAccount,40,false);
    if (account) {
      if (!/^[0-9 -]{6,40}$/.test(account)) throw new ApiError(400,'계좌번호를 확인해 주세요.');
      update.payoutAccount=seal(account.replace(/[ -]/g,''),user!.id);
    }
  }
  await prisma.user.update({where:{id:user!.id},data:update});
  return profile(user!.id);
}); }
