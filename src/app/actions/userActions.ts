"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AVAILABLE_BANK_CARD_IDS } from "@/lib/banks";

const MAX_WALLET_SIZE = 20;

function sanitizeCards(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const id = raw.trim().toUpperCase();
    if (!AVAILABLE_BANK_CARD_IDS.has(id)) continue;
    seen.add(id);
    if (seen.size >= MAX_WALLET_SIZE) break;
  }
  return Array.from(seen);
}

export async function syncWallet(ownedCards: string[]) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const cleaned = sanitizeCards(ownedCards);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { savedCards: JSON.stringify(cleaned) },
    });
    return { success: true, cards: cleaned };
  } catch (error) {
    console.error("Failed to sync wallet:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function getUserWallet() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { savedCards: true },
    });

    if (!user?.savedCards) return { success: true, cards: [] };

    try {
      const parsed = JSON.parse(user.savedCards);
      return { success: true, cards: sanitizeCards(parsed) };
    } catch {
      return { success: true, cards: [] };
    }
  } catch (error) {
    console.error("Failed to get user wallet:", error);
    return { success: false, error: "Failed to fetch from database" };
  }
}
