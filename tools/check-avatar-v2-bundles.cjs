// Verify exact PNG content and dimensions in both offline Expo exports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.join(root,'assets/generated/avatars-v2');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
const exportsByPlatform={android:process.env.DREAMS_AVATAR_ANDROID_EXPORT||'/tmp/dreams-avatar-v2-android-final',ios:process.env.DREAMS_AVATAR_IOS_EXPORT||'/tmp/dreams-avatar-v2-ios-final'};
const results={};
for(const [platform,directory]of Object.entries(exportsByPlatform)){
  const map=JSON.parse(fs.readFileSync(path.join(directory,'assetmap.json'),'utf8'));
  const records=Object.values(map);let count=0;
  for(const [key,layer]of Object.entries(manifest.layers)){
    const bytes=fs.readFileSync(path.join(source,layer.file));
    const hash=crypto.createHash('md5').update(bytes).digest('hex');
    const record=records.find(item=>item.fileHashes?.includes(hash));
    if(!record)throw new Error(platform+': missing '+key);
    if(record.width!==layer.size[0]||record.height!==layer.size[1])throw new Error(platform+': wrong dimensions '+key);
    const exported=path.join(directory,'assets',hash);
    if(!fs.existsSync(exported)||crypto.createHash('sha256').update(fs.readFileSync(exported)).digest('hex')!==layer.sha256)throw new Error(platform+': content mismatch '+key);
    count++;
  }
  const legacy=records.flatMap(item=>item.files||[]).filter(file=>/assets\/generated\/(avatars\/|portrait-layers\.png)/.test(file));
  if(legacy.length)throw new Error(platform+': obsolete portraits still bundled');
  results[platform]={expoExportSucceeded:true,avatarLayersVerified:count,allExportedPngHashesMatch:true,allSourceDimensionsMatch:true,obsoletePortraitAssetsBundled:0};
}
const result={scope:'Offline Expo Android/iOS JavaScript and asset exports; not native builds or device/emulator rendering',...results,nativeDeviceVisualTesting:false};
const file=path.join(root,'docs/verification/avatar-v2-implementation/platform-checks.json');fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
