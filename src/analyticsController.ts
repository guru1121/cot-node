import { Request, Response } from "express";
import { fetchCityWeather, fetchCityForecast } from "./weatherService.ts";
import { db } from "./db.ts";

export async function getCitiesAnalytics(req: Request, res: Response) {
  if (!req.body || !Array.isArray(req.body.cities) || req.body.cities.length === 0) {
    return res.status(400).json({ error: "Request body must contain a non-empty 'cities' array" });
  }

  const { cities } = req.body;

  const results = await Promise.all(cities.map((c: string) => fetchCityWeather(c)));


  for (const r of results) {
    await db.query(
      `INSERT INTO cities (name, last_temperature, last_fetched_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_temperature=?, last_fetched_at=NOW()`,
      [r.city, r.temp, r.temp]
    );
  }

  const temps = results.map(r => r.temp);

  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const max = results.reduce((a, b) => (a.temp > b.temp ? a : b));
  const min = results.reduce((a, b) => (a.temp < b.temp ? a : b));
  const hotCities = results.filter(r => r.temp > 35).map(r => r.city);

  res.json({
    averageTemperature: avg,
    highestTemperature: max,
    lowestTemperature: min,
    hotCities,
  });
}

export async function getCityAnalytics(req: Request, res: Response) {
  const city = req.params.name;

  const weather = await fetchCityWeather(city);
  const forecast = await fetchCityForecast(city);

  const warning = weather.temp > 35 ? "Heat Alert" : null;

  res.json({
    city,
    currentTemperature: weather.temp,
    forecast,
    warning,
  });
}
