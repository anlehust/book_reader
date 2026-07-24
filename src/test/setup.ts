import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// PDF.js expects browser geometry globals that jsdom does not implement.
if (!globalThis.DOMMatrix) {
  (globalThis as typeof globalThis & { DOMMatrix: typeof DOMMatrix }).DOMMatrix = class DOMMatrix {} as typeof DOMMatrix;
}
if (!globalThis.Path2D) {
  (globalThis as typeof globalThis & { Path2D: typeof Path2D }).Path2D = class Path2D {} as typeof Path2D;
}
if (!globalThis.ImageData) {
  (globalThis as typeof globalThis & { ImageData: typeof ImageData }).ImageData = class ImageData {} as unknown as typeof ImageData;
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
