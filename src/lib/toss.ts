import { ApiError } from './security';
export function tossConfig() {
  const secret = process.env.TOSS_SECRET_KEY || '';
  const client = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
  // Live activation requires a separate operational review (escrow/payout contracts).
  if (!secret.startsWith('test_sk_') || !client.startsWith('test_ck_')) throw new ApiError(503, '토스 테스트 결제 설정이 필요합니다. 실결제는 아직 활성화되지 않았습니다.');
  return { secret, client };
}
export class TossError extends ApiError {
  constructor(public code: string) { super(502, '결제 공급자 확인이 완료되지 않았습니다. 잠시 후 같은 결제를 다시 확인해 주세요.'); }
}
export type TossPayment = { paymentKey: string; orderId: string; currency: string; totalAmount: number; status: string; method?: string; receipt?: { url?: string } };
export async function toss(path: string, method: 'GET' | 'POST', payload?: object, key?: string): Promise<TossPayment> {
  const { secret } = tossConfig();
  const response = await fetch(`https://api.tosspayments.com/v1/payments${path}`, {
    method, headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString('base64')}`, 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}) },
    ...(payload ? { body: JSON.stringify(payload) } : {}), signal: AbortSignal.timeout(15000), cache: 'no-store',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new TossError(typeof error.code === 'string' ? error.code : 'UNKNOWN');
  }
  return response.json();
}
