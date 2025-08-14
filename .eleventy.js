// .eleventy.js
const { DateTime } = require("luxon");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const rssPlugin = require("@11ty/eleventy-plugin-rss");
const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  // ---------------------------
  // Plugins
  // ---------------------------
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(rssPlugin);

  // ---------------------------
  // Passthrough Copy
  // ---------------------------
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/style.css");
  // Example: eleventyConfig.addPassthroughCopy({ "src/images": "images" });

  // ---------------------------
  // Inline SVG icon shortcode
  // ---------------------------
  const ICON_CACHE = new Map();
  const ICON_DIR = path.join(__dirname, "src", "_icons");

  function renderIcon(name, opts = {}) {
    const file = path.join(ICON_DIR, `${name}.svg`);
    if (!ICON_CACHE.has(file)) {
      if (!fs.existsSync(file)) throw new Error(`Icon not found: ${file}`);
      ICON_CACHE.set(file, fs.readFileSync(file, "utf8"));
    }
    let svg = ICON_CACHE.get(file);

    const {
      width = 16,
      height = 16,
      class: className,
      title,                 // optional: label for screen readers
      decorative = !title,   // default: decorative if no title
      strokeWidth = 1        // default stroke thickness
    } = opts;

    // Ensure the file has a viewBox (required for proper scaling)
    if (!/viewBox="/i.test(svg)) {
      // Try to infer common Tabler default; adjust if your set differs
      svg = svg.replace(
        /<svg\b/i,
        '<svg viewBox="0 0 24 24"'
      );
    }

    // Remove per-element stroke-width so our global one wins
    svg = svg.replace(/stroke-width="[^"]*"/g, "");

    // Rebuild the root <svg ...> attributes
    svg = svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
      let a = attrs.trim();

      const replaceAttr = (str, attr, val) =>
        str.replace(new RegExp(`\\b${attr}="[^"]*"`, "g"), "").trim() + ` ${attr}="${val}"`;

      // Size — always set (prevents 300x150 default)
      a = replaceAttr(a, "width", width);
      a = replaceAttr(a, "height", height);

      // Color model / style defaults
      a = replaceAttr(a, "stroke", "currentColor");
      a = replaceAttr(a, "fill", "none");
      a = replaceAttr(a, "stroke-width", strokeWidth);
      a = replaceAttr(a, "stroke-linecap", "round");
      a = replaceAttr(a, "stroke-linejoin", "round");

      // Class merge
      if (className) {
        if (/\bclass="/.test(a)) {
          a = a.replace(/\bclass="([^"]*)"/, (_, c) => `class="${c} ${className}"`);
        } else {
          a += ` class="${className}"`;
        }
      }

      // A11y
      if (decorative) {
        if (!/\baria-hidden=/.test(a)) a += ' aria-hidden="true"';
        if (!/\brole=/.test(a)) a += ' role="img"';
      } else {
        if (!/\brole=/.test(a)) a += ' role="img"';
      }

      return `<svg ${a.trim()}>`;
    });

    // Add a title node if provided
    if (title && !svg.includes("<title")) {
      svg = svg.replace(/<svg[^>]*>/, (open) => `${open}\n  <title>${title}</title>`);
    }

    return svg;
  }

  eleventyConfig.addNunjucksShortcode("icon", renderIcon);
  eleventyConfig.addLiquidShortcode("icon", renderIcon);

  // ---------------------------
  // Collections
  // ---------------------------
  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const tagSet = new Set();
    collectionApi.getAllSorted().forEach((item) => {
      if ("tags" in item.data) {
        const tags = item.data.tags.filter((t) => !["all", "nav", "post"].includes(t));
        tags.forEach((t) => tagSet.add(String(t).toLowerCase()));
      }
    });
    return [...tagSet];
  });

  eleventyConfig.addCollection("journal", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/journal/**/*.md");
  });

  // ---------------------------
  // Filters
  // ---------------------------
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
    (collection || []).forEach((item) => {
      const d = DateTime.fromJSDate(item.date, { zone: "America/Chicago" });
      const key = d.toFormat("yyyy-LL");
      (groups[key] ||= []).push(item);
    });
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  });

  // Take the first N items of an array (Eleventy docs pattern)
  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array)) return array;
    if (n < 0) return array.slice(n);
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

  // ---------------------------
  // Computed data
  // ---------------------------
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

  // ---------------------------
  // Final return
  // ---------------------------
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