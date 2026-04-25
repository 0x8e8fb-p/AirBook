"use server";

import {
  airApi,
  AirApiConfigError,
  AirApiError,
} from "@/lib/api/airApiClient";

export async function getTrafficDaily(
  fromDate?: string,
  toDate?: string,
  year?: number,
  month?: number,
) {
  try {
    return await airApi.getTrafficDaily({ fromDate, toDate, year, month });
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Traffic daily error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function getTrafficSummary() {
  try {
    return await airApi.getTrafficSummary();
  } catch (err) {
    if (err instanceof AirApiConfigError || err instanceof AirApiError) {
      console.error("Traffic summary error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getDomesticTraffic() {
  const [daily, summary] = await Promise.allSettled([
    airApi.getTrafficDaily({ limit: 10 }),
    airApi.getTrafficSummary(),
  ]);
  return {
    daily: daily.status === "fulfilled" ? daily.value : [],
    summary: summary.status === "fulfilled" ? summary.value : null,
  };
}
