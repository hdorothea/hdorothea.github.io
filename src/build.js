const handleBars = require("handlebars");
const fs = require("fs");
const pretty = require("pretty");
const path = require("path");

handleBars.registerHelper('capitalize', function (str) {
  if(str && typeof str === "string") {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
  }
  return '';
});

function archives(
  parsedHeadlines,
  templatePath,
  outputPath
) {
  const archivesHtml = pretty(handleBars.compile(
    fs.readFileSync(templatePath).toString()
  )({ headlines: parsedHeadlines }));
  fs.writeFileSync(outputPath, archivesHtml);
}

function posts(parsedEntries, templatePath, outputPath) {
  for (const parsedEntry of parsedEntries) {
    const postHtml = pretty(
      handleBars.compile(fs.readFileSync(templatePath).toString())(parsedEntry)
    );
    const postOutputPath = path.join(outputPath, `./${parsedEntry.slug}.html`);
    if (!postOutputPath) {
      fs.mkdirSync(postOutputPath);
    }
    fs.writeFileSync(postOutputPath, postHtml);
  }
}

module.exports = {
  archives,
  posts
};
