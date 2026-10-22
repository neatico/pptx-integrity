import JSZip from 'jszip';
const TYPES='[Content_Types].xml';
const xml=(source:string)=>{const doc=new DOMParser().parseFromString(source,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('Invalid PPTX XML');return doc;};
/** PptxGenJS 4.0.1 declares one master per slide but writes one shared master.
 * Remove only those unreferenced phantom declarations. Never hide broken
 * relationships or remove real parts. Check the final package before download. */
export async function finalizePptxArchive(bytes:Uint8Array):Promise<Uint8Array>{
 const zip=await JSZip.loadAsync(bytes);
 const manifest=zip.file(TYPES);if(!manifest)throw new Error('Missing PPTX content types');
 const referenced=new Set<string>();
 for(const file of Object.values(zip.files).filter(file=>!file.dir&&file.name.endsWith('.rels'))){
  const doc=xml(await file.async('string'));
  const owner=file.name==='_rels/.rels'?'':file.name.replace(/_rels\/([^/]+)\.rels$/,'$1');
  const base=new URL(owner,'https://pptx.invalid/');
  for(const relationship of Array.from(doc.getElementsByTagNameNS('*','Relationship'))){
   if(relationship.getAttribute('TargetMode')==='External')continue;
   const target=relationship.getAttribute('Target');if(!target)throw new Error('Missing PPTX relationship target');
   const resolved=new URL(target,base);
   if(resolved.origin!=='https://pptx.invalid')throw new Error('Invalid PPTX internal relationship');
   const part=decodeURIComponent(resolved.pathname.slice(1));
   if(!zip.file(part))throw new Error(`Missing PPTX relationship part: ${part}`);
   referenced.add(part);
  }
 }
 const doc=xml(await manifest.async('string'));
 for(const override of Array.from(doc.getElementsByTagNameNS('*','Override'))){
  const part=(override.getAttribute('PartName')||'').replace(/^\//,'');
  if(zip.file(part))continue;
  if(/^ppt\/slideMasters\/slideMaster\d+\.xml$/.test(part)&&!referenced.has(part))override.remove();
  else throw new Error(`Missing PPTX content part: ${part}`);
 }
 zip.file(TYPES,new XMLSerializer().serializeToString(doc));
 return zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
}
