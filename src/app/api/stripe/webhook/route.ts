import { NextResponse } from 'next/server';
export function POST() { return NextResponse.json({ error: '이 결제 경로는 종료되었습니다.' }, { status: 410 }); }
