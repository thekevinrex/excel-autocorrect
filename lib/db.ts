import { PrismaClient } from "@prisma/client";

declare global {
	var prisma: PrismaClient | undefined;
}

const db = global.prisma || new PrismaClient();

global.prisma = db;

export default db;
