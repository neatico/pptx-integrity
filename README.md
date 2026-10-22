# @neatico/pptx-integrity

`finalizePptxArchive(bytes: Uint8Array): Promise<Uint8Array>` checks generated PPTX packages before download. Rejects malformed XML, missing internal relationship targets, and missing declared parts. Removes only unreferenced missing `ppt/slideMasters/slideMasterN.xml` declarations emitted by PptxGenJS 4.0.1. Real parts and slide content remain intact.

Requires browser DOMParser and XMLSerializer; server tools may supply standards-compatible DOM globals. Intended for trusted generated exports, not arbitrary uploaded ZIP files. Structural checks do not establish visual fidelity or native PowerPoint compatibility.

Uses JSZip. Run `npm test` before packing. Version 0.1.0 is consumed as a local tarball. Publication is deferred to the repository owner.
