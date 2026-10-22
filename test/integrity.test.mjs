import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {JSDOM} from 'jsdom';
import {finalizePptxArchive} from '../dist/index.js';
const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
const archive = async (manifest, relationships, parts = {}) => {
 const zip = new JSZip();
 zip.file('[Content_Types].xml', manifest);
 if (relationships) zip.file('_rels/.rels', relationships);
 for (const [name, text] of Object.entries(parts)) zip.file(name, text);
 return zip.generateAsync({type: 'uint8array'});
};
test('removes only phantom masters, preserves native content, supports namespaces', async () => {
 const bytes = await archive('<ct:Types xmlns:ct="urn:types"><ct:Override PartName="/ppt/slideMasters/slideMaster2.xml"/><ct:Override PartName="/ppt/slides/slide1.xml"/></ct:Types>', '<r:Relationships xmlns:r="urn:rels"><r:Relationship Target="ppt/slides/slide1.xml"/></r:Relationships>', {'ppt/slides/slide1.xml': '<editable>原文</editable>'});
 const zip = await JSZip.loadAsync(await finalizePptxArchive(bytes));
 assert.equal(await zip.file('ppt/slides/slide1.xml').async('string'), '<editable>原文</editable>');
 assert.doesNotMatch(await zip.file('[Content_Types].xml').async('string'), /slideMaster2/);
});
test('rejects referenced missing masters', async () => {
 const bytes = await archive('<Types/>', '<Relationships><Relationship Target="ppt/slideMasters/slideMaster2.xml"/></Relationships>');
 await assert.rejects(finalizePptxArchive(bytes), /Missing PPTX relationship part/);
});
test('rejects missing non-master declarations', async () => {
 await assert.rejects(finalizePptxArchive(await archive('<Types><Override PartName="/ppt/slides/slide2.xml"/></Types>')), /Missing PPTX content part/);
});
test('validates relative internal relationships and ignores declared external links', async () => {
 const bytes = await archive('<Types/>', '<Relationships><Relationship TargetMode="External" Target="https://example.com"/></Relationships>', {'ppt/slides/_rels/slide1.xml.rels':'<Relationships><Relationship Target="../media/image.png"/></Relationships>', 'ppt/media/image.png':'image'});
 await finalizePptxArchive(bytes);
});
test('rejects malformed XML and undeclared external relationships', async () => {
 await assert.rejects(finalizePptxArchive(await archive('<Types>')), /Invalid PPTX XML/);
 await assert.rejects(finalizePptxArchive(await archive('<Types/>','<Relationships><Relationship Target="https://example.com"/></Relationships>')), /Invalid PPTX internal relationship/);
});
