'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
function Confirmation() {
  const params = useSearchParams();
  const [message, setMessage] = useState('테스트 결제 승인 결과를 확인하고 있습니다…');
  const [orderId, setOrderId] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(true);
  const key = params.get('paymentKey'), id = params.get('orderId'), amount = params.get('amount');
  useEffect(() => {
    let active = true; setBusy(true);
    if (!key || !id || !amount) { setMessage('유효한 결제 정보가 없습니다.'); setBusy(false); return; }
    fetch('/api/payments/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentKey: key, orderId: id, amount: Number(amount) }) }).then(async res => {
      const result = await res.json(); if (!res.ok || !result.success) throw new Error(result.error || '결제 결과를 확인하지 못했습니다.');
      if (active) { setOrderId(result.data.orderId); setMessage('테스트 결제 승인이 확인되었습니다. 실제 에스크로 보관 또는 송금 완료를 의미하지 않습니다.'); }
    }).catch(e => { if (active) setMessage(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [key, id, amount, retry]);
  return <main className="mx-auto max-w-lg px-5 py-20"><h1 className="mb-5 text-2xl font-bold">결제 결과 확인</h1><p role="status" className="leading-relaxed">{message}</p>{orderId ? <a className="mt-6 inline-block rounded-xl bg-teal-700 px-5 py-3 text-white" href={`/?view=trade&order=${encodeURIComponent(orderId)}`}>해당 거래실로 돌아가기</a> : <><button disabled={busy} onClick={() => setRetry(v => v + 1)} className="mt-6 rounded-xl border p-3 disabled:opacity-50">결제 결과 다시 확인</button><a href="/?view=mine" className="ml-4 underline">내 거래</a></>}</main>;
}
export default function Success() { return <Suspense fallback={<p>결제 정보를 불러오는 중입니다…</p>}><Confirmation /></Suspense>; }
