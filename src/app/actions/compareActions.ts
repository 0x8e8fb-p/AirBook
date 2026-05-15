"use server";

import {
  travelpayoutsApi,
  TravelpayoutsConfigError,
  TravelpayoutsError,
} from "@/lib/api/travelpayoutsClient";

export async function getOtaComparison(origin: string, destination: string) {
  try {
    return await travelpayoutsApi.compareOta(origin, destination);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("OTA comparison error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getAirlineComparison(origin: string, destination: string) {
  try {
    return await travelpayoutsApi.compareAirline(origin, destination);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Airline comparison error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBestBankCombo(origin: string, destination: string) {
  try {
    return await travelpayoutsApi.getBankCombo(origin, destination);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
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
    return await travelpayoutsApi.getBestForRoute(origin, destination, bank);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
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
    travelpayoutsApi.compareOta(origin, destination),
    travelpayoutsApi.compareAirline(origin, destination),
    travelpayoutsApi.getBankCombo(origin, destination),
    travelpayoutsApi.getBestForRoute(origin, destination),
  ]);
  return {
    ota: ota.status === "fulfilled" ? ota.value : null,
    airline: airline.status === "fulfilled" ? airline.value : null,
    combo: combo.status === "fulfilled" ? combo.value : null,
    routeBest: routeBest.status === "fulfilled" ? routeBest.value : null,
  };
}
