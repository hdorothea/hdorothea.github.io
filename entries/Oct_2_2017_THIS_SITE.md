A couple months back I played around with [Jekyll](https://jekyllrb.com/) and [Hexo](https://hexo.io/) a little bit. With both of them it felt to me like I was more working against them then they were working for me. All along I knew that what I wanted for my site/blog was a very simple thing. I wanted a simple main page linking to an archives page with links to blogposts and I wanted to be able to write my blogposts in markdown. The question at hand was: should I figure out how to do these things with Jekyll or Hexo or just rebuild those few things myself. Thinking about it a little more I realized that all I needed were two simple templates, a markdown parser, reading in some files and writing out some files. Realizing that there are good markdown parsers out there I decided to go with option two and hacked together a simple static site generator in an afternoon. (Honestly I hesitate to even call it a static site generator because that somehow sounds like something cool and complicated and what I hacked together is in essence just a simple script, but it does generate a static site so I guess it is a static site generator). I had a whole lot of fun in the process, so I think it was the right decision if only for that reason.

My static site generator is so simple that it propably doesn't make sense for anyone else to use it. You could of course use it with your own templates, but rather than figuring that out you will be better of just writing your own and my static site generator is ideal to explain the basic idea.

So how does it work? Simple! You create a directory in which you put markdown files which have a name containing the date and the title of the entry separated by underscores. (You can specify the location of this directory as a command line argument to the main script. By default it is a directory called entries in the top level directory). I then get all of the paths to these entries.

```javascript
const entryPaths = fs
  .readdirSync(entriesPath)
  .map(fname => path.join(entriesPath, fname));
```

Then I parse the files resulting in an array of parsedEntries `[{'title': 'Entry1 title', 'date':'Entry1 date', 'slug':'Entry1 title with whitespaces replaced', 'content':'html converted from the markdown'}, ...]`

```javascript 
function parseEntry(entryPath) {
  const entryFname = path.basename(entryPath);
  return {
    slug: parseSlug(entryFname),
    date: parseDate(entryFname),
    title: parseTitle(entryFname),
    text: readAndParseContent(entryPath)
  };
}

function parseEntries(entryPaths) {
  return entryPaths.map(entryPath => parseEntry(entryPath));
};

const parsedEntries = parseEntries(entryPaths);
```
Title, date and slug parsing is trivial. To convert the markdown of the content to html I use [remarkable](https://github.com/jonschlinkert/remarkable). To get code higlighting I use [highlight.js](https://highlightjs.org/). To make remarkable and highlight.js work together you specify the highlight option in the constructor of the remarkable converter.
```javascript
const Remarkable = require("remarkable");
const hljs = require("highlight.js");

const mdConverter = new Remarkable({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(lang, str).value;

    return hljs.highlightAuto(str).value;
  },
});


function readAndParseContent(entryPath) {
  const markdownString = fs.readFileSync(entryPath).toString();
  return mdConverter.render(markdownString);
}
```
Now that I have my parsedEntries I somehow need to insert this data into templates so that I get my static html files. I want to end up with one one archives page and one post page per entry. Again you can hand the paths to the handlebar templates to the main script. By default they are in the same directory as the script and are called `archives.handlebars` and `post.handlebars`.

archives.handlebars:
```handlebars
 <body>
    <div class="content">
      <h1> Dorothea's Blog </h1>
      {{#each headlines}}
        <div class="headline">
            <a href="posts/{{slug}}.html" class="title">
            {{title}}
            </a>
            <div class="date">
              {{date}}
            </div>
        </div>
      {{/each}}
    </div>
  </body>
  ```

and post.handlebars:
```handlebars
<body>
    <div class="content">
      <div class="headline">
        <div class="title"> {{ title }} </div>
        <div class="date"> {{ date }}</div>
      </div>
      <div class="text">
        {{{text}}}
      </div>
    </div>
</body>
```
And I compile them using the parsedEntries. The archives page:
```javascript
function buildArchives(
  parsedHeadlines,
  templatePath,
  outputPath
) {
  const archivesHtml = handleBars.compile(
    fs.readFileSync(templatePath).toString()
  )({ headlines: parsedHeadlines });
  fs.writeFileSync(outputPath, archivesHtml);
}

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

buildArchives(
  parsedEntries.map(entry => ({
    title: entry.title,
    date: entry.date,
    slug: entry.slug
  })),
  archivesTemplatePath,
  path.join(outputPath, "archives.html")
);
```
And the posts one by one:
```javascript
function buildPosts(parsedEntries, templatePath, outputPath) {
  for (const parsedEntry of parsedEntries) {
    const postHtml = handleBars.compile(
      fs.readFileSync(templatePath).toString()
    )(parsedEntry);
    const postOutputPath = path.join(
      outputPath, `./${parsedEntry.slug}.html`
    );
    if (!postOutputPath) {
      fs.mkdirSync(postOutputPath);
    }
    fs.writeFileSync(postOutputPath, postHtml);
  }
}

if (!fs.existsSync(path.join(outputPath, "posts"))) {
  fs.mkdirSync(path.join(outputPath, "posts"));
}

buildPosts(parsedEntries, postTemplatePath, path.join(outputPath, "posts"));
```

To have a good development and writting experience I didn't want to recompile manually each time I was hacking on my static site generator or changing/adding a blogpost. To recompile when the static site generating scripts or blogposts change I use [watch](https://www.npmjs.com/package/watch) and to reload automatically when any of the output html files or css files change I use [live-server](https://www.npmjs.com/package/live-server).

In my package.json file I have:

  ```javascript
  "scripts": {
    "start": "concurrently 'npm run reload' 'npm run watch'",
    "reload": "live-server --open=./build",
    "watch": "watch 'npm run build' ./src ./entries",
    "build": "node ./src/main.js --entriesPath ./entries/ --archivesTemplatePath ./src/archives.handlebars --postTemplatePath ./src/post.handlebars --outputPath ./build"
  }
  ```

Now I just run `npm run start` whenever I am working on my blog. This makes for a really good development and writting experience.


