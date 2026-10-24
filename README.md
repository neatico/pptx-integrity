<div align="center">
  <a href="https://www.neatico.com/?utm_source=npm&utm_medium=readme&utm_campaign=pptx-integrity">
    <img src="https://www.neatico.com/brand/neatico-logo.svg" width="220" alt="Neatico" />
  </a>
  <h1>@neatico/pptx-integrity</h1>
  <p>Validate generated PPTX relationships and repair the phantom slide-master declarations emitted by PptxGenJS.</p>
  <p>
    <a href="https://www.npmjs.com/package/@neatico/pptx-integrity"><img src="https://img.shields.io/npm/v/@neatico/pptx-integrity.svg?style=flat-square&label=npm" alt="npm version" /></a>
    <a href="https://github.com/neatico/pptx-integrity"><img src="https://img.shields.io/badge/source-github-111827?style=flat-square" alt="source" /></a>
    <img src="https://img.shields.io/badge/license-MIT-10b981?style=flat-square" alt="license: MIT" />
    <img src="https://img.shields.io/badge/ESM%20%2B%20CJS-yes-6366f1?style=flat-square" alt="ESM and CJS" />
  </p>
</div>

---

`@neatico/pptx-integrity` is a final gate before a generated presentation reaches the download button. It inspects the OOXML package, confirms every internal relationship resolves to a real part, and removes exactly one class of invalid declaration that [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) 4.0.1 produces.

## The problem it fixes

PptxGenJS 4.0.1 declares one slide master per slide in `[Content_Types].xml` but writes a single shared master. The extra `ppt/slideMasters/slideMasterN.xml` overrides point at parts that do not exist, which can make PowerPoint flag the file as corrupt. This package removes **only** those unreferenced phantom declarations — it never hides a genuinely broken relationship or deletes real content.

## Installation

```sh
npm install @neatico/pptx-integrity
```

Ships as ES modules, CommonJS, and TypeScript declarations. It depends on [JSZip](https://stuk.github.io/jszip/) and requires `DOMParser` / `XMLSerializer` globals (native in browsers; provide them with `jsdom` in Node).

## Usage

```ts
import { finalizePptxArchive } from "@neatico/pptx-integrity";

// `bytes` is the Uint8Array PptxGenJS produced with `outputType: "nodebuffer"`
// or `blob.arrayBuffer()`.
const cleaned = await finalizePptxArchive(bytes);

// `cleaned` is a re-compressed Uint8Array ready to save as .pptx
```

### Node setup

```js
import { JSDOM } from "jsdom";
import { finalizePptxArchive } from "@neatico/pptx-integrity";

const dom = new JSDOM();
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;

const cleaned = await finalizePptxArchive(pptxBytes);
```

In a browser, `DOMParser` and `XMLSerializer` are already available.

## What it checks

| Check | Outcome |
|---|---|
| Missing `[Content_Types].xml` | Throws `Missing PPTX content types` |
| Malformed XML anywhere parsed | Throws `Invalid PPTX XML` |
| Relationship with no `Target` | Throws `Missing PPTX relationship target` |
| Internal relationship whose target part does not exist | Throws `Missing PPTX relationship part: …` |
| Internal relationship escaping the package root | Throws `Invalid PPTX internal relationship` |
| Non-master `Override` pointing at a missing part | Throws `Missing PPTX content part: …` |
| Unreferenced `slideMasterN.xml` override | **Removed**, package re-zipped |

Relative internal targets (e.g. `../media/image.png`) are resolved against their owning `.rels` file. Relationships marked `TargetMode="External"` are ignored, so legitimate hyperlinks are not treated as broken.

## API

```ts
function finalizePptxArchive(bytes: Uint8Array): Promise<Uint8Array>;
```

The input is treated as immutable; a new, deflate-compressed (`level 6`) archive is returned.

## Scope and limitations

This is a **structural integrity** check for **trusted, generated** exports — not a parser for arbitrary user-uploaded ZIP files. It establishes that internal parts resolve and the manifest is consistent; it does not prove visual fidelity or that PowerPoint will render every feature as intended. Run it after generation and before download.

## Development

```sh
npm install
npm test        # builds ESM/CJS, then runs the node:test suite
```

## Meet Neatico

This package is one of the engines inside **[Neatico](https://www.neatico.com/?utm_source=npm&utm_medium=readme&utm_campaign=pptx-integrity)** — the AI workspace that turns a single idea into pixel-perfect, fully editable visuals, including editable PowerPoint decks. When Neatico exports a presentation, this gate ensures the file opens cleanly in PowerPoint, Keynote, and Google Slides.

The `@neatico/*` packages are the framework-independent pieces extracted from that product so you can build your own editor or pipeline. Want the finished experience instead of the primitives? **[Start creating free on neatico.com →](https://www.neatico.com/?utm_source=npm&utm_medium=readme&utm_campaign=pptx-integrity)**

## License

MIT. See [LICENSE](./LICENSE).
