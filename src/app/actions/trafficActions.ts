"use server";

import {
  travelpayoutsApi,
  TravelpayoutsConfigError,
  TravelpayoutsError,
} from "@/lib/api/travelpayoutsClient";

export async function getTrafficDaily(
  fromDate?: string,
  toDate?: string,
  year?: number,
  month?: number,
) {
  try {
    return await travelpayoutsApi.getTrafficDaily({ fromDate, toDate, year, month });
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Traffic daily error:", err.message);
      return [];
    }
    throw err;
  }
}

export async function getTrafficSummary() {
  try {
    return await travelpayoutsApi.getTrafficSummary();
  } catch (err) {
    if (err instanceof TravelpayoutsConfigError || err instanceof TravelpayoutsError) {
      console.error("Traffic summary error:", err.message);
      return null;
    }
    throw err;
  }
}

export async function getDomesticTraffic() {
  const [daily, summary] = await Promise.allSettled([
    travelpayoutsApi.getTrafficDaily({ limit: 10 }),
    travelpayoutsApi.getTrafficSummary(),
  ]);
  return {
    daily: daily.status === "fulfilled" ? daily.value : [],
    summary: summary.status === "fulfilled" ? summary.value : null,
  };
}
