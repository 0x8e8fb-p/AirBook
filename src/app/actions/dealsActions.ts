"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function getDealsTrends() {
  try {
    return await airApi.getDealsTrends();
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Deals trends error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getNearbyAirportDeals(iata: string, radiusKm = 150) {
  try {
    return await airApi.getNearbyAirportDeals(iata, radiusKm);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Nearby airports error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBankOffers(bank?: string, ota?: string, limit = 50) {
  try {
    return await airApi.searchBankOffers(bank, ota, limit);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Bank offers error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function getSearchCoupons(
  q?: string,
  bank?: string,
  ota?: string,
  airline?: string,
  limit = 50,
) {
  try {
    return await airApi.searchCoupons(q, bank, ota, airline, limit);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Coupons search error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function getDealsPageData(origin?: string) {
  const [trends, bankOffers] = await Promise.allSettled([
    airApi.getDealsTrends(),
    airApi.searchBankOffers(undefined, undefined, 20),
  ]);
  const nearby = origin
    ? (await Promise.allSettled([airApi.getNearbyAirportDeals(origin)]))[0]
    : null;
  return {
    trends: trends.status === "fulfilled" ? trends.value : null,
    bankOffers: bankOffers.status === "fulfilled" ? bankOffers.value ?? [] : [],
    nearby: nearby && nearby.status === "fulfilled" ? nearby.value : null,
  };
}
