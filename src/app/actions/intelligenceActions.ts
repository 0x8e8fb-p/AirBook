"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function getPriceForecast(
  origin: string,
  destination: string,
  days = 30,
) {
  try {
    return await airApi.getForecast(origin, destination, days);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
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
    return await airApi.predictPrice(origin, destination, airline, departDate);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
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
    return await airApi.getBestTimeToBook(origin, destination);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Booking advice error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getTrendingRoutes(limit = 20) {
  try {
    return await airApi.getTrendingRoutes(limit);
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
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
    airApi.getForecast(origin, destination, 30),
    airApi.predictPrice(origin, destination, airline, date),
    airApi.getBestTimeToBook(origin, destination),
  ]);
  return {
    forecast: forecast.status === "fulfilled" ? forecast.value : null,
    prediction: prediction.status === "fulfilled" ? prediction.value : null,
    advice: advice.status === "fulfilled" ? advice.value : null,
  };
}
