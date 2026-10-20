#!/usr/bin/env node
// Computes sunrise, sunset and day length for every day of a year in Oslo,
// using SunCalc's standard solar position formulas (Astronomical Algorithms,
// Jean Meeus), and writes the result to src/data.json. Run once when the page
// is made or updated; the page itself only reads the committed JSON, it
// never calls a network API at runtime (pages/README.md: pages are static).
import SunCalc from "suncalc";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const YEAR = 2026;
const LAT = 59.9139; // Oslo
const LON = 10.7522;
const TIME_ZONE = "Europe/Oslo";

function localHM(date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

function minutesSinceMidnight(date) {
  const { hour, minute } = localHM(date);
  return hour * 60 + minute;
}

function hm(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(Math.round(minutes % 60)).padStart(2, "0");
  return `${h}:${m}`;
}

function daysInYear(year) {
  return (new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1) ? 366 : 365;
}

const days = [];
const total = daysInYear(YEAR);
for (let day = 0; day < total; day++) {
  // Noon UTC avoids any date-boundary ambiguity from timezone offset.
  const date = new Date(Date.UTC(YEAR, 0, 1 + day, 12, 0, 0));
  const times = SunCalc.getTimes(date, LAT, LON);
  const sunriseMin = minutesSinceMidnight(times.sunrise);
  const sunsetMin = minutesSinceMidnight(times.sunset);
  const dayLengthMin = Math.round((times.sunset.getTime() - times.sunrise.getTime()) / 60000);
  const iso = `${YEAR}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  days.push({
    date: iso,
    sunrise: hm(sunriseMin),
    sunset: hm(sunsetMin),
    sunriseMin: Math.round(sunriseMin),
    sunsetMin: Math.round(sunsetMin),
    dayLengthMin,
  });
}

const out = { year: YEAR, lat: LAT, lon: LON, timeZone: TIME_ZONE, days };
fs.writeFileSync(path.join(DIR, "..", "src", "data.json"), JSON.stringify(out));
console.log(`generate-data: wrote ${days.length} days to src/data.json`);
