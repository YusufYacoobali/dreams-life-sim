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
      ['screen-npc','15-npc-profile.png'],['screen-family-profile','16-family-profile.png'],['screen-family-tree','17-family-tree.png'],['skin-dark-base','18-skin-tones-dark-source.png'],['clothing','19-sixteen-clothing-choices.png'],['screen-clothing-screen','20-clothing-screen.png'],['polish-comparison','21-framing-before-after.png'],['hair-fit-4','22-shoulder-hair-face-fits.png'],['hair-fit-5','23-long-curls-face-fits.png'],['hair-fit-7','24-coily-hair-face-fits.png'],['long-hair-ages','25-long-hair-age-fits.png']];
    captures.push(['women-comparison','26-women-hair-before-after.png'],['women-defaults','27-eight-women-hairstyles.png'],['women-ages','28-women-age-fits.png'],['women-hair-options','29-women-short-hair-and-buns.png'],['women-colours','30-women-hair-colours.png'],['women-sizes-light','31-women-sizes-light.png'],['women-sizes-dark','32-women-sizes-dark.png'],['crewnecks','33-front-only-crewnecks.png']);
    captures.push(['infants','34-infant-heads.png'],['infant-transition','35-infant-to-child.png']);
    for(const[id,file]of captures){
      await page.locator('#'+id).screenshot({path:path.join(directory,file),animations:'disabled'});
      if(file==='04-four-at-140px.png'||file==='03-sixteen-rendered-identities.png'){
        // Keep both sides of the framing comparison at the same screenshot
        // scale, and refresh its embedded "after" image in this capture run.
        const png=fs.readFileSync(path.join(directory,file)).toString('base64');
        const target=file==='04-four-at-140px.png'?'#polish-comparison img[alt^="Current portraits"]':'#women-comparison img[alt^="Current assembled"]';
        await page.locator(target).evaluate((el,data)=>{el.src='data:image/png;base64,'+data;return el.decode();},png);
        const htmlFile=path.join(directory,'index.html'),key='docs/verification/avatar-v2-implementation/'+file;
        const html=fs.readFileSync(htmlFile,'utf8'),marker=JSON.stringify(key)+':"',start=html.indexOf(marker)+marker.length,end=html.indexOf('"',start);
        if(start<marker.length||end<start)throw new Error('Missing current framing comparison asset');
        fs.writeFileSync(htmlFile,html.slice(0,start)+png+html.slice(end));
      }
    }
    const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const grid=await page.locator('#screen-creation [aria-label="Avatar"]').evaluate(el=>{
      const cells=[...el.children];const rows={};for(const c of cells){const y=Math.round(c.getBoundingClientRect().top);rows[y]=(rows[y]||0)+1;}return {cells:cells.length,columnsPerRow:Object.values(rows)};
    });
    if(grid.cells!==16||grid.columnsPerRow.some(n=>n!==4))throw new Error('Creation grid layout mismatch: '+JSON.stringify(grid));
    const imageChecks=await page.evaluate(()=>({images:document.images.length,svgImages:document.querySelectorAll('svg image').length,allDecoded:window.avatarSvgImagesDecoded&&[...document.images].every(i=>i.complete&&i.naturalWidth>0)}));
    const svgChecks=await page.evaluate(()=>{
      const clips=[...document.querySelectorAll('svg clipPath[id]')],ids=clips.map(el=>el.id);
      const references=[...document.querySelectorAll('svg [clip-path]')];
      return {uniqueSvgClipIds:new Set(ids).size===ids.length,allSvgClipReferencesResolve:references.every(el=>{
        const id=el.getAttribute('clip-path').slice(5,-1),target=document.getElementById(id);
        return target&&el.closest('svg').contains(target);
      })};
    });
    await page.setViewportSize({width:390,height:844});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(errors.length||externalRequests.length||desktopOverflow||mobileOverflow||!imageChecks.allDecoded||!svgChecks.uniqueSvgClipIds||!svgChecks.allSvgClipReferencesResolve)throw new Error(JSON.stringify({errors,externalRequests,desktopOverflow,mobileOverflow,imageChecks,svgChecks}));
    const result={renderer:'Chromium CSS/SVG adapter of actual React Native production screen/component trees; NOT native device screenshots',browser:browser.version(),deviceScaleFactor:2,cssProfileSizes:[52,88,140,184],captures:captures.map(([,file])=>file),creationGrid:grid,...imageChecks,...svgChecks,desktopOverflow,mobileOverflow,errors,externalRequests};
    fs.writeFileSync(path.join(directory,'browser-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
