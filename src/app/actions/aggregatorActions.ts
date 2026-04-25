"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function searchAggregatorFlights(
  fromCode: string,
  toCode: string,
  departDate: string,
  returnDate?: string,
  providers?: string[],
) {
  try {
    return await airApi.aggregatorSearch(
      fromCode,
      toCode,
      departDate,
      returnDate,
      providers,
    );
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Aggregator search error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getAggregatorProviders() {
  try {
    return await airApi.listProviders();
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Providers error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getProviderOffers(provider: string) {
  try {
    return await airApi.getProviderOffers(provider);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Provider offers error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function getAggregatorBestDeal(
  fromCode: string,
  toCode: string,
  departDate: string,
) {
  try {
    return await airApi.aggregatorBestDeal(fromCode, toCode, departDate);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Aggregator best deal error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function searchMultiCity(
  legs: { from_code: string; to_code: string; date: string }[],
  passengers = 1,
) {
  try {
    return await airApi.multiCitySearch(legs, passengers);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Multi-city error:", err.message);
      return null;
    }
    throw err;
  }
}
