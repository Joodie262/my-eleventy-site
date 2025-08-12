// src/src.11tydata.js
// Applies the timezone-safe date normalization to ALL content
// EXCEPT anything under /src/journal/ (journal has its own fixer).

const { DateTime } = require("luxon");

module.exports = {
  eleventyComputed: {
    date: (data) => {
      const src = (data.page?.inputPath || "").replaceAll("\\", "/");

      // Skip journal — that folder already has its own date computation.
      if (src.includes("/src/journal/")) return data.date;

      const orig = data.date;
      if (!(orig instanceof Date)) return orig;

      // Is this exactly UTC midnight? (typical for bare dates)
      const isUTCMidnight =
        orig.getUTCHours() === 0 &&
        orig.getUTCMinutes() === 0 &&
        orig.getUTCSeconds() === 0 &&
        orig.getUTCMilliseconds() === 0;

      // If filename contains YYYY-MM-DD, prefer that as the intended LOCAL day.
      const filenameISO = (src.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || null;

      if (isUTCMidnight && filenameISO) {
        // Treat filename date as local calendar day at noon (DST-safe).
        return DateTime.fromISO(`${filenameISO}T12:00`, {
          zone: "America/Chicago",
        }).toJSDate();
      }

      // Otherwise, normalize to the same LOCAL day at noon.
      const local = DateTime.fromJSDate(orig, { zone: "utc" }).setZone("America/Chicago");
      return DateTime.fromObject(
        { year: local.year, month: local.month, day: local.day, hour: 12 },
        { zone: "America/Chicago" }
      ).toJSDate();
    },
  },
};
