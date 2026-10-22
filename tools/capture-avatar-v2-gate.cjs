// Review-only browser capture. No production dependency or app changes.
// PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium \
//   node tools/capture-avatar-v2-gate.cjs
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
  const directory=path.resolve(__dirname,'../docs/verification/avatar-v2-art-gate');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1240,height:1000},deviceScaleFactor:1});
    const errors=[],externalRequests=[];
    page.on('pageerror',error=>errors.push(String(error)));
    page.on('request',request=>{if(/^https?:/.test(request.url()))externalRequests.push(request.url());});
    await page.setContent(fs.readFileSync(path.join(directory,'index.html'),'utf8'),{waitUntil:'networkidle'});
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    await page.evaluate(()=>document.fonts.ready);
    const captures=[['cast','01-sixteen-avatar-grid.png'],['comparison','02-original-vs-v2.png'],['details','03-four-enlarged-portraits.png'],['profiles','04-profile-sizes.png'],['alpha','05-transparency.png']];
    for(const[id,file]of captures)await page.locator('#'+id).screenshot({path:path.join(directory,file),animations:'disabled'});
    const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    await page.setViewportSize({width:390,height:844});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(errors.length||externalRequests.length||desktopOverflow||mobileOverflow)throw new Error(JSON.stringify({errors,externalRequests,desktopOverflow,mobileOverflow}));
    const result={scope:'Phase 2 finished artwork browser review; not native app screenshots',browser:browser.version(),captures:captures.map(([,file])=>file),cssProfileSizes:[52,88,140],desktopViewport:[1240,1000],mobileViewport:[390,844],desktopOverflow,mobileOverflow,allImagesDecoded:true,errors,externalRequests};
    fs.writeFileSync(path.join(directory,'browser-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
