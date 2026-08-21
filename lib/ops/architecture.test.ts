import { describe, expect, it } from 'vitest';
import {
  architecturePdfFilename,
  architectureStarterHtml,
  portalCanvasPath,
  portalCanvasPdfHref,
  portalCanvasPdfPath,
} from './architecture';

describe('architecture canvas paths', () => {
  it('builds the live canvas and generated PDF URLs', () => {
    expect(portalCanvasPath('nirc', 'abc')).toBe('/p/nirc/canvas/abc');
    expect(portalCanvasPdfPath('nirc', 'abc')).toBe('/p/nirc/canvas/abc/pdf');
  });

  it('derives the PDF download from a canvas iframe src', () => {
    expect(portalCanvasPdfHref('/p/nirc/canvas/abc')).toBe('/p/nirc/canvas/abc/pdf');
    expect(portalCanvasPdfHref('/p/nirc/canvas/abc?x=1')).toBe('/p/nirc/canvas/abc/pdf');
    expect(portalCanvasPdfHref('/client-packs/nirc/arquitectura.html')).toBeNull();
    expect(portalCanvasPdfHref(null)).toBeNull();
  });

  it('slugifies the canvas title for the PDF filename', () => {
    expect(architecturePdfFilename('Arquitectura NIRC')).toBe('arquitectura-nirc.pdf');
    expect(architecturePdfFilename('  ')).toBe('arquitectura.pdf');
  });

  it('starts new canvases with a printable Mermaid document', () => {
    const html = architectureStarterHtml('Plan');
    expect(html).toContain('<pre class="mermaid">');
    expect(html).toContain('mermaid.initialize');
  });
});
