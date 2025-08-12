// src/src.11tydata.js
const { DateTime } = require("luxon");

module.exports = {
  eleventyComputed: {
    date: (data) => {
      const src = data.page?.inputPath || "";
      const orig = data.date;

      if (!(orig instanceof Date)) return orig;

      const isUTCMidnight =
        orig.getUTCHours() === 0 &&
        orig.getUTCMinutes() === 0 &&
        orig.getUTCSeconds() === 0 &&
        orig.getUTCMilliseconds() === 0;

      const filenameISO = (src.match(/(\d{4}-\d{2}-\d{2})/) || [])[1] || null;

      if (isUTCMidnight && filenameISO) {
        return DateTime.fromISO(`${filenameISO}T12:00`, {
          zone: "America/Chicago",
        }).toJSDate();
      }

      const local = DateTime.fromJSDate(orig, { zone: "utc" }).setZone("America/Chicago");
      return DateTime.fromObject(
        { year: local.year, month: local.month, day: local.day, hour: 12 },
        { zone: "America/Chicago" }
      ).toJSDate();
    },
  },
};
