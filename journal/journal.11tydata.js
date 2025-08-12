// journal/journal.11tydata.js
// Purpose: Ensure each journal page’s `date` matches its intended LOCAL (America/Chicago) calendar day.
// Why: Bare dates (e.g., `date: 2025-08-08`) are parsed as UTC midnight by Eleventy/JS,
//      which can display as the previous day in Chicago. This file fixes that consistently.

const { DateTime } = require("luxon");

module.exports = {
  eleventyComputed: {
    /**
     * Compute a safe, timezone-aware `date` for every page in this folder.
     * Strategy:
     * 1) If the page’s original date is exactly UTC midnight (typical for bare dates)
     *    AND the filename contains YYYY-MM-DD, treat that filename date as the intended
     *    LOCAL calendar day and set time to noon (avoids DST edge cases).
     * 2) Otherwise (explicit timestamp present), convert to Chicago and normalize to noon
     *    on the same local calendar day.
     */
    date: (data) => {
      const src = data.page && data.page.inputPath;
      const orig = data.date;

      // If Eleventy didn't give us a real Date, return as-is (don’t break anything).
      if (!(orig instanceof Date)) return orig;

      // Check if Eleventy parsed a "bare date" → exactly 00:00:00.000Z (UTC midnight).
      const isUTCMidnight =
        orig.getUTCHours() === 0 &&
        orig.getUTCMinutes() === 0 &&
        orig.getUTCSeconds() === 0 &&
        orig.getUTCMilliseconds() === 0;

      // Try to pull YYYY-MM-DD from the filename (e.g., "2025-06-24 Journal.md").
      const filenameISO = src && (src.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || null);

      if (isUTCMidnight && filenameISO) {
        // Interpret the filename date as the intended LOCAL calendar day at noon.
        return DateTime.fromISO(`${filenameISO}T12:00`, {
          zone: "America/Chicago",
        }).toJSDate();
      }

      // Otherwise, respect the original instant but normalize to the same local day at noon.
      const local = DateTime.fromJSDate(orig, { zone: "utc" }).setZone("America/Chicago");
      return DateTime.fromObject(
        { year: local.year, month: local.month, day: local.day, hour: 12 },
        { zone: "America/Chicago" }
      ).toJSDate();
    },
  },
};
