import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { getAllOps } from 'adacad-drafting-lib';

const URL = 'http://localhost:4200/';
const docsOpsBase = path.resolve(__dirname, '../docs/docs/reference/operations');
const screenshotsDir = './screenshots';
// raw screenshots from puppeteer
const screenshotsRawDir = path.join(screenshotsDir, 'raw');
// cropped screenshots from sharp
const screenshotsProcessedDir = path.join(screenshotsDir, 'processed');
// note this padding is just for the top and bottom of the image
let verticalCropPadding = 20;

async function main() {

  // optional args 
  const skipScreenshots = process.argv.includes('--skip-screenshots');
  const skipCropping = process.argv.includes('--preview');

  if (skipScreenshots && skipCropping) {
    console.log('...');
    return;
  }

  const filterFiles = process.argv.find(arg => arg.startsWith('--filter='));
  const filterFileNames: Array<string> = filterFiles ? filterFiles.split('=')[1].split(',').map(name => name.trim()) : [];

  const paddingArg = process.argv.find(arg => arg.startsWith('--padding='));
  if (paddingArg) {
    const padding = paddingArg.split('=')[1];
    verticalCropPadding = Number(padding);
  }

  // create screenshot directories if they don't exist
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  if (!fs.existsSync(screenshotsRawDir)) {
    fs.mkdirSync(screenshotsRawDir);
  }
  if (!fs.existsSync(screenshotsProcessedDir)) {
    fs.mkdirSync(screenshotsProcessedDir);
  }

  if (!skipScreenshots) {
    await captureScreenshots(filterFileNames);
  }

  if (!skipCropping) {
    await cropScreenshots(filterFileNames);
  }

  console.log('script finished');
}

async function captureScreenshots(specificAdaFilesToCapture: Array<string>) {
  console.log('launching browser!');
  const browser = await puppeteer.launch({
    // uncomment the line below to see the screenshots happen live
    // headless: false,
  });

  console.log('opening new page');
  const page = await browser.newPage();

  // Set a larger viewport
  await page.setViewport({ width: 2100, height: 1000 });

  console.log(`navigating to ${URL}`);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.waitForNetworkIdle();

  console.log('page loaded');

  await new Promise(t => setTimeout(t, 1000));

  // inject CSS to:
  // 1. remove the "added to workspace" animation that is on the component titles
  // 2. remove the side nav drag button that appears on the top left of the viewport otherwise
  await page.evaluate(async () => {
    const style = document.createElement('style');
    style.type = 'text/css';
    const content = `
      .operation-details {
        animation: unset !important;
      }

      .sidenav_mover {
        visibility: hidden !important;
      }
    `;
    style.appendChild(document.createTextNode(content));
    const promise = new Promise((resolve, reject) => {
      style.onload = resolve;
      style.onerror = reject;
    });
    document.head.appendChild(style);
    await promise;
  });

  // Use adacad-drafting-lib ops; for each op, look for .ada files in docs/reference/operations/{category}/{op.name}/
  console.log('loading ops from adacad-drafting-lib and checking for .ada files in docs');
  const ops = getAllOps();
  const allAdaEntries: Array<{ filePath: string; componentName: string; opName: string }> = [];

  for (const op of ops) {
    const category = op.meta.categories?.[0]?.name;
    if (!category) continue;
    const opDir = path.join(docsOpsBase, category, op.name);
    if (!fs.existsSync(opDir)) continue;
    const files = fs.readdirSync(opDir).filter(name => name !== '.DS_Store' && name.endsWith('.ada'));
    for (const adaFile of files) {
      const filePath = path.join(opDir, adaFile);
      const componentName = path.basename(adaFile, '.ada');
      allAdaEntries.push({ filePath, componentName, opName: op.name });
    }
  }

  console.log(`found ${allAdaEntries.length} .ada files`);

  // apply the optional --filter arg if it was provided (match op name or .ada basename)
  const filteredAdaEntries = specificAdaFilesToCapture.length > 0
    ? allAdaEntries.filter(
      ({ filePath, componentName }) =>
        specificAdaFilesToCapture.some(
          name => componentName.startsWith(name) || filePath.includes(path.sep + name + path.sep)
        )
    )
    : allAdaEntries;

  if (allAdaEntries.length > filteredAdaEntries.length) {
    console.log('filter applied, capturing file count: ' + filteredAdaEntries.length);
  }

  let i = 1;
  for (const { filePath, componentName, opName } of filteredAdaEntries) {
    process.stdout.write('processing file #' + i++ + ' ' + filePath + '\r');
    const adaFile = fs.readFileSync(filePath, 'utf8');
    const jsonAdaFile = JSON.parse(adaFile);

    await page.evaluate(async (adaFile) => {
      await (window as any).loadAdaFileJson(adaFile);
      // we have to wait awhile for each one, because it takes time to load
      // the save state, and we sometimes see the loading modal pop up
      await new Promise(t => setTimeout(t, 200));
      await (window as any).autoLayout();
      await new Promise(t => setTimeout(t, 200));
      await (window as any).zoomToFit();
    }, jsonAdaFile);

    const mainView = await page.waitForSelector('app-palette');
    const rawPath = path.join(screenshotsRawDir, componentName) + '.png' as `${string}.png`;
    await mainView?.screenshot({ path: rawPath });
    const adaDir = path.dirname(filePath);
    const croppedPath = path.join(adaDir, opName + '.png');
    await cropImage(rawPath, croppedPath);
  }

  console.log();
  console.log('completed screenshots, closing browser, and starting cropping process');

  // potential future enhancement here: verify output files in some way

  await browser.close();
}

async function cropImage(inputPath: string, outputPath: string): Promise<void> {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // background of ADA is #f0f0f0 which is 240
  const threshold = 230;

  const hits: Array<Array<number> | null> = Array.from({ length: Math.floor(width / 10) })
    .map((_, x) => Array.from({ length: height }).map((_, y) => {
      const i = (y * width + (x * 10)) * channels;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const avg = rgb.reduce((a, c) => a + c, 0) / 3;
      return avg < threshold ? [x, y] : null;
    })).reduce((a, c) => [...a, ...c]).filter(Boolean);

  const bounds = hits.reduce((acc, hit) => {
    return {
      minY: Math.min(acc.minY, hit?.[1] ?? 0),
      maxY: Math.max(acc.maxY, hit?.[1] ?? 0)
    };
  }, { minY: height, maxY: 0 });

  const top = Math.max(bounds.minY - verticalCropPadding, 0);
  const bottom = Math.min(bounds.maxY + verticalCropPadding, height);
  const cropHeight = bottom - top;

  await image
    .extract({ top, height: cropHeight, left: 0, width })
    .png({ quality: 80 })
    .toFile(outputPath);
}

async function cropScreenshots(specificImagesToCrop: Array<string>) {
  const imageFileNames = fs.readdirSync(screenshotsRawDir).filter(name => name !== '.DS_Store');

  const filteredImageFiles = specificImagesToCrop.length > 0
    ? imageFileNames.filter(file => specificImagesToCrop.findIndex(name => file.startsWith(name)) > -1)
    : imageFileNames;

  if (imageFileNames.length > filteredImageFiles.length) {
    console.log('filter applied, matching image file count: ' + filteredImageFiles.length);
  }

  let i = 1;
  for (const imageFileName of filteredImageFiles) {
    process.stdout.write('cropping file #' + i++ + '\r');
    await cropImage(
      path.join(screenshotsRawDir, imageFileName),
      path.join(screenshotsProcessedDir, imageFileName)
    );
  }

  console.log();
  console.log('completed cropping');
}

main().catch(console.error);

