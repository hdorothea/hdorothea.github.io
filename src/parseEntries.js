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
  return new Date(fname
    .split('_')
    .slice(0, 3)
    .join(' '));
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

function sortEntries(entries, by = 'date', reverse = 'true') {
  return entries.sort((a, b) => {
    if (a[by] < b[by]) {
      if (reverse) {
        return 1;
      } else {
        return -1;
      }
    }
    if (a[by] === b[by]) {
      return 0;
    }

    if (a[by] > b[by]) {
      if (reverse) {
        return -1;
      } else {
        return 1;
      }
    }
  });
}

function parseEntries(entryPaths) {
  return entryPaths.map(entryPath => parseEntry(entryPath));
}

module.exports = {
  sortEntries,
  parseEntries
};
