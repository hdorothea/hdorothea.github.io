const handleBars = require('handlebars');
const fs = require('fs');
const pretty = require('pretty');
const path = require('path');
const xmlFormater = require('xml-formatter');

handleBars.registerHelper('capitalize', function (str) {
  if (str && typeof str === 'string') {
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
  }
  return '';
});

function build(context, templatePath, outputPath, formater) {
  const compiled = handleBars.compile(fs.readFileSync(templatePath).toString())(context);
  fs.writeFileSync(outputPath, formater(compiled));
  return compiled;
}

function archives(parsedEntries, withRss, templatePath, outputPath) {
  build({ headlines: parsedEntries, withRss }, templatePath, outputPath, pretty);
}

function rss(parsedEntries, baseUrl, templatePath, outputPath) {
  build({ posts: parsedEntries, baseUrl }, templatePath, outputPath, xmlFormater);
}

function posts(parsedEntries, templatePath, outputPath) {
  if (!outputPath) {
    fs.mkdirSync(outputPath);
  }
  for (const parsedEntry of parsedEntries) {
    const postOutputPath = path.join(outputPath, `./${parsedEntry.slug}.html`);
    build(parsedEntry, templatePath, postOutputPath, pretty);
  }
}

module.exports = {
  archives,
  posts,
  rss
};
