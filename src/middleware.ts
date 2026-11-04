import { NextResponse, NextRequest } from 'next/server';
export function middleware(_req: NextRequest) {
  // Legacy receipts were public; preserve the files but stop unauthenticated access.
  return NextResponse.json({ error: '이전 공개 파일 경로는 종료되었습니다.' }, { status: 410 });
}
export const config = { matcher: '/uploads/receipts/:path*' };
