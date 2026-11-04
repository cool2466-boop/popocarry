import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
const handler = NextAuth(authOptions);
function configured() { return process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32; }
export function GET(req: Request, context: unknown) {
  if (!configured()) return NextResponse.json({ error: '인증 설정이 필요합니다.' }, { status: 503 });
  return handler(req, context);
}
export function POST(req: Request, context: unknown) {
  if (!configured()) return NextResponse.json({ error: '인증 설정이 필요합니다.' }, { status: 503 });
  return handler(req, context);
}
