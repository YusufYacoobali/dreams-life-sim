// Optional review-only Playwright installation; not a mobile dependency.
// PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium \
//   node tools/capture-portrait-review.cjs
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { root, portraitLayers, portraitTraits } = require('./portrait-review-data.cjs');
async function main() {
  const directory = path.join(root,'docs/verification/avatar-checkpoint-b');
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page=await browser.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:1});
    const errors=[], externalRequests=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>{if(/^https?:/.test(request.url()))externalRequests.push(request.url());});
    await page.setContent(fs.readFileSync(path.join(directory,'index.html'),'utf8'),{waitUntil:'networkidle'});
    await page.evaluate(()=>window.portraitReviewReady);
    await page.evaluate(()=>document.fonts.ready);
    const captures=[['new-cast','01-new-cast.png'],['comparison','02-reference-previous-new.png'],['presets','03-all-16-presets.png'],['sizes','04-sizes-light-dark.png'],['colours','05-skin-hair-colours.png'],['faces-hair','06-face-hair-matrix.png'],['ages','07-eight-age-stages.png'],['age-hair','08-child-adult-elderly.png'],['transparency','09-transparency.png']];
    for(const [id,file] of captures)await page.locator('#'+id).screenshot({path:path.join(directory,file),animations:'disabled'});
    // The interactive inspector uses the exact production TS modules too.
    await page.selectOption('#face','3');await page.selectOption('#skin','5');
    await page.selectOption('#hair','5');await page.selectOption('#hairColor','3');
    await page.fill('#age','86');await page.dispatchEvent('#age','input');
    await page.selectOption('#background','dark');
    const expected=portraitLayers(portraitTraits({face:3,skin:5,hair:5,hairColor:3},86)).map(layer=>layer.asset);
    const actual=await page.locator('#interactive-preview .portrait').first().locator('[data-asset]').evaluateAll(nodes=>nodes.map(node=>node.dataset.asset));
    if(JSON.stringify(expected)!==JSON.stringify(actual))throw new Error('Interactive plan differs from production');
    await page.locator('#interactive').screenshot({path:path.join(directory,'10-interactive-combination.png')});
    const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    await page.setViewportSize({width:390,height:844});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(errors.length||externalRequests.length||desktopOverflow||mobileOverflow)throw new Error(JSON.stringify({errors,externalRequests,desktopOverflow,mobileOverflow}));
    const result={renderer:'Browser screenshots of the production layer plan, not native device captures',browser:browser.version(),captures:captures.map(([,file])=>file).concat('10-interactive-combination.png'),cssSizes:[52,88,140],deviceScaleFactor:1,desktopViewport:[1240,1000],mobileViewport:[390,844],desktopOverflow,mobileOverflow,interactivePlanMatchesProduction:true,errors,externalRequests};
    fs.writeFileSync(path.join(directory,'browser-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
