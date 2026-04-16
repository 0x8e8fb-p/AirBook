"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function syncWallet(ownedCards: string[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        savedCards: JSON.stringify(ownedCards)
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to sync wallet:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function getUserWallet() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { savedCards: true }
    });

    if (user?.savedCards) {
      return { success: true, cards: JSON.parse(user.savedCards) as string[] };
    }
    
    return { success: true, cards: [] };
  } catch (error) {
    console.error("Failed to get user wallet:", error);
    return { success: false, error: "Failed to fetch from database" };
  }
}