const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

const CONTENT_DIR = 'src/content';
const DIST_DIR = 'dist';
const TEMPLATE_DIR = 'src/templates';

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function readTemplate(name) {
  const template = await fs.readFile(path.join(TEMPLATE_DIR, name), 'utf-8');
  return template;
}

async function processMarkdown(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { attributes, body } = frontMatter(content);
  const html = marked(body);
  return { attributes, html };
}

async function buildPage(templateName, content, outputPath) {
  // First read the base template
  const baseTemplate = await readTemplate('base.html');
  
  // Then read and process the page template
  const pageTemplate = await readTemplate(templateName);
  
  // Replace content in page template
  const pageContent = pageTemplate.replace('{{content}}', content.html);
  
  // Replace variables in base template
  const result = baseTemplate
    .replace('{{title}}', content.attributes.title || 'Static Site')
    .replace('{{description}}', content.attributes.description || '')
    .replace('{{content}}', pageContent);
  
  await fs.writeFile(outputPath, result);
}

async function build() {
  // Create necessary directories
  await ensureDir(DIST_DIR);
  
  // Copy static assets
  await ensureDir(path.join(DIST_DIR, 'css'));
  await fs.copyFile(
    path.join('static', 'css', 'style.css'),
    path.join(DIST_DIR, 'css', 'style.css')
  );

  // Process markdown files
  const files = await fs.readdir(CONTENT_DIR);
  for (const file of files) {
    if (path.extname(file) === '.md') {
      const content = await processMarkdown(path.join(CONTENT_DIR, file));
      const outputPath = path.join(
        DIST_DIR,
        file.replace('.md', '.html')
      );
      await buildPage('page.html', content, outputPath);
    }
  }

  console.log('Build completed!');
}

build().catch(console.error); 