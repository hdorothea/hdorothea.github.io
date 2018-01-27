const fs = require('fs');
const path = require('path');
const pretty = require('pretty');

const Remarkable = require('remarkable');
const hljs = require('highlight.js');

const slug = require('slug');

const mdConverter = new Remarkable({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (err) {
        console.log(err);
      }
    }

    try {
      return hljs.highlightAuto(str).value;
    } catch (err) {
      console.log(err);
    }

    return ''; // use external default escaping
  },
  breaks: true
});

function parseDate(fname) {
  return fname
    .split('_')
    .slice(0, 3)
    .join(' ');
}

function parseTitle(fname) {
  const title = fname
    .split('_')
    .slice(3)
    .join(' ');
  return title.substr(0, title.lastIndexOf('.')) || title;
}

function parseSlug(fname) {
  return slug(parseTitle(fname).toLowerCase());
}

function readAndParseContent(entryPath) {
  const markdownString = fs.readFileSync(entryPath).toString();
  return mdConverter.render(markdownString);
}

function parseEntry(entryPath) {
  const entryFname = path.basename(entryPath);
  return {
    slug: parseSlug(entryFname),
    date: parseDate(entryFname),
    title: parseTitle(entryFname),
    text: readAndParseContent(entryPath)
  };
}

module.exports = function parseEntries(entryPaths) {
  return entryPaths.map(entryPath => parseEntry(entryPath));
};
