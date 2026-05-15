"use server";

import {
  travelpayoutsApi,
  TravelpayoutsConfigError,
  TravelpayoutsError,
} from "@/lib/api/travelpayoutsClient";

export async function searchAggregatorFlights(
  fromCode: string,
  toCode: string,
  departDate: string,
  returnDate?: string,
  providers?: string[],
) {
  try {
    return await travelpayoutsApi.aggregatorSearch(
      fromCode,
      toCode,
      departDate,
      returnDate,
      providers,
    );
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Aggregator search error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getAggregatorProviders() {
  try {
    return await travelpayoutsApi.listProviders();
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Providers error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getProviderOffers(provider: string) {
  try {
    return await travelpayoutsApi.getProviderOffers(provider);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
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
    return await travelpayoutsApi.aggregatorBestDeal(fromCode, toCode, departDate);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
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
    return await travelpayoutsApi.multiCitySearch(legs, passengers);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Multi-city error:", err.message);
      return null;
    }
    throw err;
  }
}
