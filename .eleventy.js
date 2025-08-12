// .eleventy.js
const { DateTime } = require("luxon");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const rssPlugin = require('@11ty/eleventy-plugin-rss');

module.exports = function(eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(rssPlugin);

  // Passthroughs (update to match where your assets actually live)
  eleventyConfig.addPassthroughCopy("src/style.css");
  // Example: eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // Tag list collection
  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const tagSet = new Set();
    collectionApi.getAllSorted().forEach((item) => {
      if ("tags" in item.data) {
        const tags = item.data.tags.filter(t => !["all","nav","post"].includes(t));
        tags.forEach(t => tagSet.add(String(t).toLowerCase()));
      }
    });
    return [...tagSet];
  });

  // Date formatting (display)
  eleventyConfig.addFilter("formatDate", (value, format = "MMMM d, yyyy") => {
    let dt;
    if (typeof value === "string") {
      dt = DateTime.fromISO(value, { zone: "America/Chicago" });
    } else if (value instanceof Date) {
      dt = DateTime.fromJSDate(value, { zone: "America/Chicago" });
    } else if (DateTime.isDateTime(value)) {
      dt = value.setZone("America/Chicago");
    } else {
      return "⚠️ Invalid date";
    }
    return dt.isValid ? dt.toFormat(format) : "⚠️ Invalid date";
  });

  // Cache-busting
  const version = String(Date.now());
  eleventyConfig.addGlobalData("version", version);
  eleventyConfig.addFilter("versioned", (url) => `${url}?v=${version}`);

  // Group by month (uses Eleventy’s final page.date)
  eleventyConfig.addFilter("groupByMonth", (collection) => {
    const groups = {};
    collection.forEach((item) => {
      const d = DateTime.fromJSDate(item.date, { zone: "America/Chicago" });
      const key = d.toFormat("yyyy-LL");
      (groups[key] ||= []).push(item);
    });
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  });

  // Optional: compute permalinks for journal files based on filename date
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      const inputPath = (data.page.inputPath || "").replaceAll("\\", "/");
      if (!inputPath.includes("/src/journal/")) {
        return data.permalink ?? false; // leave non-journal alone
      }
      const match = inputPath.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) return `journal/${match[1].replace(/-/g, "/")}/index.html`;
      return `journal/invalid/${data.page.fileSlug}/index.html`;
    },
    // IMPORTANT: do NOT define `date` here—handled by src/*.11tydata.js files
  });

// Take the first N items of an array (Eleventy docs pattern)
eleventyConfig.addFilter("head", (array, n) => {
  if (!Array.isArray(array)) return array;
  if (n < 0) return array.slice(n); // support negative like head(-1)
  return array.slice(0, n);
});

// Escape text for XML (titles, etc.)
eleventyConfig.addFilter("xmlEscape", (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
});

  // Journal collection (now points at src)
  eleventyConfig.addCollection("journal", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/journal/**/*.md");
    // or: return collectionApi.getFilteredByGlob("src/journal/**/*.md");
  });

  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
      data: "",
    },
  };
};
