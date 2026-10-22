// Captures actual React Native component trees through the browser CSS adapter.
// No native/device rendering claim. Playwright is a review-only dependency.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
  const directory=path.resolve(__dirname,'../docs/verification/avatar-v2-implementation');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1250,height:1000},deviceScaleFactor:2});
    const errors=[],externalRequests=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>{if(/^https?:/.test(request.url()))externalRequests.push(request.url());});
    await page.setContent(fs.readFileSync(path.join(directory,'index.html'),'utf8'),{waitUntil:'networkidle'});
    await page.evaluate(()=>window.avatarReviewReady);
    if(errors.length)throw new Error('Component review rendering failed: '+errors.join('; '));
    const captures=[['comparison','01-reference-previous-new.png'],['approved-comparison','02-approved-vs-assembled.png'],
      ['all-presets','03-sixteen-rendered-identities.png'],['four-140','04-four-at-140px.png'],['skin','05-six-skin-tones.png'],
      ['hair-colours','06-five-hair-colours.png'],['hairstyles','07-eight-hairstyles.png'],['face-shapes','08-four-face-shapes.png'],
      ['ages','09-eight-age-stages.png'],['sizes-light','10-sizes-light.png'],['sizes-dark','11-sizes-dark.png'],
      ['screen-creation','12-creation-screen.png'],['screen-life','13-life-screen.png'],['screen-profile','14-player-profile.png'],
      ['screen-npc','15-npc-profile.png'],['screen-family-profile','16-family-profile.png'],['screen-family-tree','17-family-tree.png'],['skin-dark-base','18-skin-tones-dark-source.png'],['clothing','19-sixteen-clothing-choices.png'],['screen-clothing-screen','20-clothing-screen.png']];
    for(const[id,file]of captures)await page.locator('#'+id).screenshot({path:path.join(directory,file),animations:'disabled'});
    const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const grid=await page.locator('#screen-creation [aria-label="Avatar"]').evaluate(el=>{
      const cells=[...el.children];const rows={};for(const c of cells){const y=Math.round(c.getBoundingClientRect().top);rows[y]=(rows[y]||0)+1;}return {cells:cells.length,columnsPerRow:Object.values(rows)};
    });
    if(grid.cells!==16||grid.columnsPerRow.some(n=>n!==4))throw new Error('Creation grid layout mismatch: '+JSON.stringify(grid));
    const imageChecks=await page.evaluate(()=>({images:document.images.length,allDecoded:[...document.images].every(i=>i.complete&&i.naturalWidth>0)}));
    await page.setViewportSize({width:390,height:844});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(errors.length||externalRequests.length||desktopOverflow||mobileOverflow||!imageChecks.allDecoded)throw new Error(JSON.stringify({errors,externalRequests,desktopOverflow,mobileOverflow,imageChecks}));
    const result={renderer:'Chromium CSS adapter of actual React Native production screen/component trees; NOT native device screenshots',browser:browser.version(),deviceScaleFactor:2,cssProfileSizes:[52,88,140],captures:captures.map(([,file])=>file),creationGrid:grid,...imageChecks,desktopOverflow,mobileOverflow,errors,externalRequests};
    fs.writeFileSync(path.join(directory,'browser-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
