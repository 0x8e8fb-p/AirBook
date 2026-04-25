"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function getOtaComparison(origin: string, destination: string) {
  try {
    return await airApi.compareOta(origin, destination);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("OTA comparison error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getAirlineComparison(origin: string, destination: string) {
  try {
    return await airApi.compareAirline(origin, destination);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Airline comparison error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBestBankCombo(origin: string, destination: string) {
  try {
    return await airApi.getBankCombo(origin, destination);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Bank combo error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBestForRoute(
  origin: string,
  destination: string,
  bank?: string,
) {
  try {
    return await airApi.getBestForRoute(origin, destination, bank);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Best-for-route error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getFareComparePageData(
  origin: string,
  destination: string,
) {
  const [ota, airline, combo, routeBest] = await Promise.allSettled([
    airApi.compareOta(origin, destination),
    airApi.compareAirline(origin, destination),
    airApi.getBankCombo(origin, destination),
    airApi.getBestForRoute(origin, destination),
  ]);
  return {
    ota: ota.status === "fulfilled" ? ota.value : null,
    airline: airline.status === "fulfilled" ? airline.value : null,
    combo: combo.status === "fulfilled" ? combo.value : null,
    routeBest: routeBest.status === "fulfilled" ? routeBest.value : null,
  };
}
