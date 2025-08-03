const { DateTime } = require("luxon");
const path = require("path");
const version = String(Date.now()); // new version on each build


module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("style.css");

  // Add the tagList collection
  eleventyConfig.addCollection("tagList", function (collectionApi) {
    let tagSet = new Set();

    collectionApi.getAllSorted().forEach(item => {
      if ("tags" in item.data) {
        let tags = item.data.tags.filter(
          tag => !["all", "nav", "post"].includes(tag) // filter unwanted
        );
        tags.forEach(tag => tagSet.add(tag.toLowerCase())); // lowercase
      }
    });

    return [...tagSet];
  });


  // ✅ Custom date formatting filter (fully fixed!)
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

  eleventyConfig.addGlobalData("version", version); // ← expose it to templates

  // ✅ Group posts by year-month for collapsible sections
  eleventyConfig.addFilter("groupByMonth", (collection) => {
    const groups = {};
    collection.forEach((item) => {
      const date = DateTime.fromJSDate(item.date);
      const key = date.toFormat("yyyy-MM");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort((a, b) => (a[0] < b[0] ? 1 : -1)); // Newest first
  });

  // ✅ Auto-calculate date and permalink from filename if not in frontmatter
  eleventyConfig.addGlobalData("eleventyComputed", {
    date: (data) => {
      if (data.date) return data.date;
      const match = data.page.inputPath.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return DateTime.fromISO(match[1], { zone: "America/Chicago" }).toJSDate();
      }
      return new Date(); // fallback
    },

    permalink: (data) => {
      const inputPath = data.page.inputPath;

      // Let Eleventy handle anything NOT inside /journal/
      if (!inputPath || !inputPath.includes("/journal/")) {
        return data.permalink ?? false;
      }

      const match = inputPath.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return `journal/${match[1].replace(/-/g, "/")}/index.html`;
      }

      return `journal/invalid/${data.page.fileSlug}/index.html`;
    }
  });

  // ✅ Journal collection
  eleventyConfig.addCollection("journal", function (collectionApi) {
    return collectionApi.getFilteredByGlob("./journal/*.md");
  });

  eleventyConfig.addFilter("versioned", (url) => {
    return `${url}?v=${version}`;
  });

  // ✅ Eleventy config options
  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
    },
  };
};