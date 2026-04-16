"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function createAlert(origin: string, destination: string, targetPrice: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.priceAlert.create({
      data: {
        userId: (session.user as any).id,
        origin,
        destination,
        targetPrice,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create alert:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function getAlerts() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, alerts };
  } catch (error) {
    console.error("Failed to get alerts:", error);
    return { success: false, error: "Failed to fetch from database" };
  }
}

export async function deleteAlert(id: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.priceAlert.delete({
      where: { 
        id,
        userId: (session.user as any).id // Security: ensure they own it
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete alert:", error);
    return { success: false, error: "Failed to delete from database" };
  }
}