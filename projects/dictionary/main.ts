import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';


const URLS = [{
  name: 'satin',
  url: 'https://docs.adacad.org/docs/reference/operations/structure/satin/',
}, {
  name: 'complex_twill',
  url: 'https://docs.adacad.org/docs/reference/operations/structure/complex_twill/',
}];


async function main() {

  // Launch the browser and open a new blank page.
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 528, height: 816 });

  // Navigate the page to a URL.

  for (const URL of URLS) {
    await page.goto(URL.url as string, {
      waitUntil: 'networkidle2',
    });
    await page.waitForNetworkIdle();


    await page.evaluate(async () => {
      const style = document.createElement('style');
      style.type = 'text/css';
      const content = `
              .breadcrumbs{
                display: none !important;
              }
              .theme-code-block{
                display: none !important;
              }

              .h2{
                font-size: 14px !important;
              }

              .markdown{
                font-size: 12px !important;
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

    await page.pdf({
      path: `${URL.name as string}.pdf`,
    });
  }
  await browser.close();
}

main();