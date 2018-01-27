// then read the html file render with handlebars write the html file
const parsedArgs = require('commander');
const fs = require('fs');
const path = require('path');

const { parseEntries, sortEntries } = require('./parseEntries');
const build = require('./build');

const { baseUrl } = require('./config');

parsedArgs
  .version('0.1.0')
  .option('--entriesPath [value]', 'Path to posts', '../entries')
  .option(
    '--archivesTemplatePath [value]',
    'Path to the handlebars template for the archive',
    './archives.handlebars'
  )
  .option(
    '--postTemplatePath [value]',
    'Path to the handlebars template for the archive',
    './post.handlebars'
  )
  .option(
    '--outputPath [value]',
    'Path to where the build static website should be outputed to',
    '../build'
  )
  .option(
    '--rssTemplatePath [value]',
    'Path to rss template',
    false
  )
  .parse(process.argv);

const {
  entriesPath, archivesTemplatePath, postTemplatePath, outputPath, rssTemplatePath
} = parsedArgs;

console.log(rssTemplatePath);

if (
  !fs.existsSync(entriesPath) ||
  !fs.existsSync(archivesTemplatePath) ||
  !fs.existsSync(postTemplatePath)
) {
  parsedArgs.help();
}

const entryPaths = fs.readdirSync(entriesPath).map(fname => path.join(entriesPath, fname));
const parsedEntries = sortEntries(parseEntries(entryPaths), 'date', true);

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

if (rssTemplatePath) {
  build.rss(parsedEntries, baseUrl, rssTemplatePath, path.join(outputPath, 'rss.xml'));
}

build.archives(
  parsedEntries.map(entry => ({
    title: entry.title,
    date: entry.date,
    slug: entry.slug
  })),
  !!rssTemplatePath,
  archivesTemplatePath,
  path.join(outputPath, 'archives.html')
);

if (!fs.existsSync(path.join(outputPath, 'posts'))) {
  fs.mkdirSync(path.join(outputPath, 'posts'));
}

build.posts(parsedEntries, postTemplatePath, path.join(outputPath, 'posts'));
