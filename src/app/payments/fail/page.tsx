'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
function Failure() {
  const params = useSearchParams();
  const trade = params.get('trade');
  const canceled = ['PAY_PROCESS_CANCELED', 'USER_CANCEL'].includes(params.get('code') || '');
  const target = trade && /^[a-zA-Z0-9_-]{1,100}$/.test(trade) ? '/?view=trade&order=' + encodeURIComponent(trade) : '/?view=mine';
  return <main className="mx-auto max-w-lg px-5 py-20"><h1 className="mb-5 text-2xl font-bold">{canceled ? '결제를 취소했습니다' : '결제를 완료하지 못했습니다'}</h1><p role="status" className="leading-relaxed">{canceled ? '거래실로 돌아가 필요할 때 다시 결제할 수 있습니다.' : '거래실에서 결제 상태를 확인해 주세요. 승인 여부가 불확실한 경우 중복 결제하지 말고 기존 결제 결과를 먼저 확인해 주세요.'}</p><a className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 text-white" href={target}>거래실로 돌아가기</a></main>;
}
export default function Fail() { return <Suspense fallback={<p>결제 정보를 확인하고 있습니다…</p>}><Failure /></Suspense>; }
