"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const FREEZE_HOURS = 24;

export interface FreezeInput {
  origin: string;
  destination: string;
  departureDate: string;
  airline: string;
  flightNumber?: string | null;
  lockedPrice: number;
  basePrice: number;
}

async function getUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return (session?.user as { id?: string } | undefined)?.id ?? null;
  } catch {
    return null;
  }
}

export async function createPriceFreeze(input: FreezeInput) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  if (!(input.lockedPrice > 0) || !(input.basePrice > 0)) {
    return { success: false, error: "Invalid price" };
  }
  const dep = new Date(input.departureDate);
  if (Number.isNaN(dep.getTime())) return { success: false, error: "Invalid date" };
  if (dep.getTime() < Date.now()) return { success: false, error: "Date in past" };

  const expiresAt = new Date(Date.now() + FREEZE_HOURS * 60 * 60 * 1000);
  const cap = new Date(dep.getTime() - 60 * 60 * 1000);
  const effectiveExpiry = expiresAt < cap ? expiresAt : cap;

  try {
    const existing = await prisma.priceFreeze.findFirst({
      where: {
        userId,
        origin: input.origin,
        destination: input.destination,
        departureDate: dep,
        airline: input.airline,
        flightNumber: input.flightNumber ?? null,
        redeemed: false,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return { success: true, freeze: existing, alreadyExisted: true };
    }

    const freeze = await prisma.priceFreeze.create({
      data: {
        userId,
        origin: input.origin,
        destination: input.destination,
        departureDate: dep,
        airline: input.airline,
        flightNumber: input.flightNumber ?? null,
        lockedPrice: input.lockedPrice,
        basePrice: input.basePrice,
        expiresAt: effectiveExpiry,
      },
    });
    return { success: true, freeze, alreadyExisted: false };
  } catch (err) {
    console.error("createPriceFreeze failed:", err);
    return { success: false, error: "Failed to create freeze" };
  }
}

export async function getUserActiveFreezes() {
  const userId = await getUserId();
  if (!userId) return [];
  try {
    const rows = await prisma.priceFreeze.findMany({
      where: { userId, redeemed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    return rows;
  } catch (err) {
    console.error("getUserActiveFreezes failed:", err);
    return [];
  }
}

export async function redeemPriceFreeze(freezeId: string) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  try {
    const freeze = await prisma.priceFreeze.findUnique({ where: { id: freezeId } });
    if (!freeze || freeze.userId !== userId) return { success: false, error: "Not found" };
    if (freeze.redeemed) return { success: false, error: "Already redeemed" };
    if (freeze.expiresAt.getTime() < Date.now()) return { success: false, error: "Expired" };
    await prisma.priceFreeze.update({
      where: { id: freezeId },
      data: { redeemed: true },
    });
    return { success: true };
  } catch (err) {
    console.error("redeemPriceFreeze failed:", err);
    return { success: false, error: "Failed" };
  }
}
