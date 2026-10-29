const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function main(){
  const out=path.resolve(__dirname,'../docs/verification/catalogue-polish');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1250,height:1000},deviceScaleFactor:2}),errors=[],external=[];
    page.on('pageerror',error=>errors.push(String(error)));page.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
    await page.setContent(fs.readFileSync(path.join(out,'index.html'),'utf8'),{waitUntil:'networkidle'});await page.evaluate(()=>window.catalogueReady);
    const panels=['homes-light','vehicles-light','homes-dark','vehicles-dark','sizes'];
    for(let i=0;i<panels.length;i++)await page.locator('#'+panels[i]).screenshot({path:path.join(out,String(i+1).padStart(2,'0')+'-'+panels[i]+'.png')});
    const decoded=await page.evaluate(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
    await page.setViewportSize({width:320,height:640});const narrowOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(errors.length||external.length||!decoded||narrowOverflow)throw Error(JSON.stringify({errors,external,decoded,narrowOverflow}));
    const checks={renderer:'Browser adapter of actual production CatalogArt trees, NOT native device captures',captures:panels.length,illustratedSubjects:40,componentSizes:[40,56,128],allImagesDecoded:decoded,narrowWidth:320,narrowOverflow,errors,externalRequests:external,nativeDeviceVisualTesting:false};
    fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify(checks,null,2)+'\n');console.log(JSON.stringify(checks,null,2));
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
