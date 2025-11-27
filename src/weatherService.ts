import axios from "axios";
import dotenv from "dotenv";
import { redis } from "./cache.ts";

dotenv.config();

const API_KEY = process.env.OWM_API_KEY;
const TTL = Number(process.env.CACHE_TTL_SECONDS);

export async function fetchCityWeather(city: string) {
  const cacheKey = `weather:${city.toLowerCase()}`;

  //  Cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${process.env.UNITS}`;

  const { data } = await axios.get(url);

  const weather = {
    city,
    temp: data.main.temp,
    humidity: data.main.humidity,
    feels_like: data.main.feels_like
  };

  await redis.set(cacheKey, JSON.stringify(weather), "EX", TTL);

  return weather;
}

export async function fetchCityForecast(city: string) {
  const cacheKey = `forecast:${city.toLowerCase()}`;

  // Check Redis Cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${process.env.UNITS}`;
  const { data } = await axios.get(url);

  const temps = data.list.map((i: any) => i.main.temp);

  const forecast = {
    min: Math.min(...temps),
    max: Math.max(...temps),
  };

  // Save to Redis
  await redis.set(cacheKey, JSON.stringify(forecast), "EX", TTL);

  return forecast;
}
