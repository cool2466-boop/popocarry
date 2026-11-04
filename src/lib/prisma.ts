import { PrismaClient } from '@/generated/client';
const shared = globalThis as unknown as { popocarryPrisma?: PrismaClient };
export const prisma = shared.popocarryPrisma ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') shared.popocarryPrisma = prisma;
export default prisma;
