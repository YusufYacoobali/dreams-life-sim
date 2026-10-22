// Check the real shared layer plan, its local asset bounds and decoded budgets.
const fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {portraitLayers,portraitTraits,portraitImages,presets,root}=require('./portrait-review-data.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/avatars-v2/manifest.json'),'utf8'));
const ages=[0,7,16,25,48,68,86,100];
const grid=new Set(),failures=[];let count=0,minLayers=Infinity,maxLayers=0,maxDecoded=0,infants=0;
presets.forEach((preset,identity)=>{
  if(preset.identity!==identity)throw new Error('Preset identity order changed');
  for(const [trait,values]of Object.entries(manifest.defaults))if(preset[trait]!==values[identity])throw new Error('Approved preset/source mismatch: '+identity+' '+trait);
});
for(const [key,file] of Object.entries(portraitImages))if(!fs.existsSync(file))failures.push('Missing '+key);
const started=performance.now();
for(let identity=0;identity<16;identity++)for(let face=0;face<4;face++)for(let skin=0;skin<6;skin++)for(let hair=0;hair<8;hair++)for(let hairColor=0;hairColor<5;hairColor++)for(const age of ages)for(let outfit=0;outfit<16;outfit++){
  const appearance={identity,face,skin,hair,hairColor,outfit};const layers=portraitLayers(portraitTraits(appearance,age));count++;minLayers=Math.min(minLayers,layers.length);maxLayers=Math.max(maxLayers,layers.length);
  if(age<3)infants++;
  const valid=age<3 ? layers.length===1&&layers[0].asset===`head-${identity}-0-${skin}`
    : layers.length>=3&&layers.length<=5&&layers.some(layer=>layer.asset===`clothing-${outfit}`);
  if(!valid)failures.push('Incomplete age-specific portrait plan');
  let decoded=0;const textures=new Set();
  for(const layer of layers){
    const asset=manifest.layers[layer.asset];
    if(!asset){failures.push('Missing '+layer.asset);continue;}
    if(!textures.has(layer.asset)){decoded+=asset.size[0]*asset.size[1]*4;textures.add(layer.asset);}
    if(layer.crop){const scaleX=layer.crop.width/asset.size[0],scaleY=layer.crop.height/asset.size[1],x=-layer.crop.left/scaleX,y=-layer.crop.top/scaleY;
      if(x<0||y<0||x+layer.width/scaleX>asset.size[0]+1e-6||y+layer.height/scaleY>asset.size[1]+1e-6)failures.push('Invalid crop '+JSON.stringify(layer));
    }
  }
  maxDecoded=Math.max(maxDecoded,decoded);
}
const elapsedMs=performance.now()-started;
for(const appearance of presets)for(const layer of portraitLayers(portraitTraits(appearance,25)))grid.add(layer.asset);
const gridDecodedBytes=[...grid].reduce((sum,key)=>sum+manifest.layers[key].size[0]*manifest.layers[key].size[1]*4,0);
const missingPersonIds=[];let personPortraitConsumers=0;
function walk(directory){for(const item of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,item.name);if(item.isDirectory())walk(file);else if(file.endsWith('.tsx')){
  const source=fs.readFileSync(file,'utf8');for(const match of source.matchAll(/<Portrait\b[^>]+\/>/g)){
    if(/appearance=\{(?!input\b)(?:[\w.\[\]]+)\.appearance\}/.test(match[0])){personPortraitConsumers++;if(!/personId=/.test(match[0]))missingPersonIds.push(path.relative(root,file));}
  }
}}}
walk(path.join(root,'app'));walk(path.join(root,'src/ui'));
if(failures.length||missingPersonIds.length)throw new Error(JSON.stringify({failures,missingPersonIds}));
const result={combinations:count,completeLocalAssets:true,cropsWithinActualSourceDimensions:true,minImageLayers:minLayers,maxImageLayers:maxLayers,infantHeadOnlyPlansVerified:infants,
  jsPlanElapsedMs:Number(elapsedMs.toFixed(2)),jsPlanMicrosecondsPerPortrait:Number((elapsedMs*1000/count).toFixed(2)),
  maxTheoreticalDecodedBytesPerPortrait:maxDecoded,adultSixteenPresetGridUniqueTextures:grid.size,adultSixteenPresetGridDecodedBytes:gridDecodedBytes,
  personPortraitConsumers,missingPersonIds,scope:'Node layer-plan and static-image budget checks, not native GPU/frame-time measurements'};
const out=path.join(root,'docs/verification/avatar-v2-implementation/runtime-checks.json');fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
