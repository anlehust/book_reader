import type {PDFDocumentProxy} from 'pdfjs-dist';

const MAX_CACHED_PAGES=12;
const cache=new WeakMap<PDFDocumentProxy,Map<number,string>>();

export async function extractPageText(document:PDFDocumentProxy,pageNumber:number,signal?:AbortSignal){
 if(signal?.aborted)throw new DOMException('Đã huỷ phân tích','AbortError');
 let pages=cache.get(document);if(!pages){pages=new Map();cache.set(document,pages)}
 const cached=pages.get(pageNumber);if(cached!==undefined){pages.delete(pageNumber);pages.set(pageNumber,cached);return cached}
 const page=await document.getPage(pageNumber);
 try{
  if(signal?.aborted)throw new DOMException('Đã huỷ phân tích','AbortError');
  const content=await page.getTextContent();
  if(signal?.aborted)throw new DOMException('Đã huỷ phân tích','AbortError');
  const text=content.items.map(item=>'str' in item?item.str:'').join(' ').replace(/\s+/g,' ').trim();
  pages.set(pageNumber,text);while(pages.size>MAX_CACHED_PAGES)pages.delete(pages.keys().next().value as number);
  return text
 }finally{page.cleanup()}
}

export function releasePageTextCache(document:PDFDocumentProxy){cache.delete(document)}
