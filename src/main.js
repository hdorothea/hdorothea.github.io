// then read the html file render with handlebars write the html file
const parsedArgs = require("commander");
const fs = require("fs");
const path = require("path");

const parseEntries = require("./parseEntries");
const build = require("./build");

parsedArgs
  .version("0.1.0")
  .option("--entriesPath [value]", "Path to posts", "../entries")
  .option(
    "--archivesTemplatePath [value]",
    "Path to the handlebars template for the archive",
    "./archives.handlebars"
  )
  .option(
    "--postTemplatePath [value]",
    "Path to the handlebars template for the archive",
    "./post.handlebars"
  )
  .option(
    "--outputPath [value]",
    "Path to where the build static website should be outputed to",
    "../build"
  )
  .parse(process.argv);

  
  const {
    entriesPath,
    archivesTemplatePath,
    postTemplatePath,
    outputPath
  } = parsedArgs;
  
  if (
    !fs.existsSync(entriesPath) ||
    !fs.existsSync(archivesTemplatePath) ||
    !fs.existsSync(postTemplatePath)
  ) {
  parsedArgs.help();
}

const entryPaths = fs
.readdirSync(entriesPath)
.map(fname => path.join(entriesPath, fname));
const parsedEntries = parseEntries(entryPaths);

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

build.archives(
  parsedEntries.map(entry => ({
    title: entry.title,
    date: entry.date,
    slug: entry.slug
  })),
  archivesTemplatePath,
  path.join(outputPath, "archives.html")
);

if (!fs.existsSync(path.join(outputPath, "posts"))) {
  fs.mkdirSync(path.join(outputPath, "posts"));
}

build.posts(parsedEntries, postTemplatePath, path.join(outputPath, "posts"));
