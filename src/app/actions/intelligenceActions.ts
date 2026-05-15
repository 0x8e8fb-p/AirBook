"use server";

import {
  travelpayoutsApi,
  TravelpayoutsConfigError,
  TravelpayoutsError,
} from "@/lib/api/travelpayoutsClient";

export async function getPriceForecast(
  origin: string,
  destination: string,
  days = 30,
) {
  try {
    return await travelpayoutsApi.getForecast(origin, destination, days);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Forecast error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getMlPricePrediction(
  origin: string,
  destination: string,
  airline: string,
  departDate: string,
) {
  try {
    return await travelpayoutsApi.predictPrice(origin, destination, airline, departDate);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Predict error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getBookingAdvice(
  origin: string,
  destination: string,
) {
  try {
    return await travelpayoutsApi.getBestTimeToBook(origin, destination);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Booking advice error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getTrendingRoutes(limit = 20) {
  try {
    return await travelpayoutsApi.getTrendingRoutes(limit);
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Trending routes error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getIntelligenceCombined(
  origin: string,
  destination: string,
  date: string,
  airline = "6E",
) {
  const [forecast, prediction, advice] = await Promise.allSettled([
    travelpayoutsApi.getForecast(origin, destination, 30),
    travelpayoutsApi.predictPrice(origin, destination, airline, date),
    travelpayoutsApi.getBestTimeToBook(origin, destination),
  ]);
  return {
    forecast: forecast.status === "fulfilled" ? forecast.value : null,
    prediction: prediction.status === "fulfilled" ? prediction.value : null,
    advice: advice.status === "fulfilled" ? advice.value : null,
  };
}
