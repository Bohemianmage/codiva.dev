import { describe, expect, it } from 'vitest';
import { resolveFileOrUrlInput } from './requested-url';

describe('resolveFileOrUrlInput', () => {
  it('accepts a hosted URL when there is no file', () => {
    expect(resolveFileOrUrlInput(null, 'drive.google.com/file/d/abc')).toEqual({
      kind: 'url',
      url: 'https://drive.google.com/file/d/abc',
    });
  });

  it('prefers the file when both are present', () => {
    const file = new File([new Uint8Array(12)], 'nda.pdf', { type: 'application/pdf' });
    expect(resolveFileOrUrlInput(file, 'https://example.com/nda.pdf')).toEqual({
      kind: 'file',
      file,
    });
  });

  it('rejects empty input', () => {
    expect(() => resolveFileOrUrlInput(null, '  ')).toThrow(/archivo o pega una URL/i);
  });
});
