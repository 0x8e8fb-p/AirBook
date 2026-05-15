"use server";

import { getServerSession } from "next-auth/next";
import { addDays } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  return user?.id ?? null;
}

function toAlertDto(alert: {
  id: string;
  origin: string;
  destination: string;
  targetPrice: number;
  active: boolean;
  createdAt: Date;
}, expiryDays = 30) {
  return {
    id: alert.id,
    source_airport: alert.origin,
    destination_airport: alert.destination,
    target_price: alert.targetPrice,
    is_active: alert.active,
    expiry_date: addDays(alert.createdAt, expiryDays).toISOString(),
  };
}

export async function subscribePriceAlert(
  source: string,
  destination: string,
  targetPrice: number,
  expiryDays = 30,
) {
  const userId = await getCurrentUserId();
  if (!userId || !source || !destination || !(targetPrice > 0)) return null;

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      origin: source.toUpperCase(),
      destination: destination.toUpperCase(),
      targetPrice,
      active: true,
    },
  });
  return toAlertDto(alert, expiryDays);
}

export async function getPriceAlerts(activeOnly = true) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const alerts = await prisma.priceAlert.findMany({
    where: { userId, ...(activeOnly ? { active: true } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return alerts.map(toAlertDto);
}

export async function removePriceAlert(id: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  await prisma.priceAlert.updateMany({
    where: { id, userId },
    data: { active: false },
  });
  return { success: true };
}

export const createAlert = subscribePriceAlert;
export const getAlerts = getPriceAlerts;
export const deleteAlert = removePriceAlert;
