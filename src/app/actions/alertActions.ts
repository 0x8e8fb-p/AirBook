"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function subscribePriceAlert(
  source: string,
  destination: string,
  targetPrice: number,
  expiryDays = 30,
) {
  try {
    return await airApi.subscribeAlert({
      source,
      destination,
      target_price: targetPrice,
      expiry_days: expiryDays,
    });
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Subscribe alert error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getPriceAlerts(activeOnly = true) {
  try {
    return await airApi.getAlerts(activeOnly);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("List alerts error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function removePriceAlert(id: string) {
  try {
    return await airApi.deleteAlert(id);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Delete alert error:", err.message);
      return null;
    }
    throw err;
  }
}

// Backward-compatible aliases for existing components
export const createAlert = subscribePriceAlert;
export const getAlerts = getPriceAlerts;
export const deleteAlert = removePriceAlert;
