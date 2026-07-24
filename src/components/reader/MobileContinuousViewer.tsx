import {Alert,Spin} from 'antd';
import {memo,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Document,Page} from 'react-pdf';
import type {PDFDocumentProxy,PDFPageProxy} from 'pdfjs-dist';

const OVERSCAN=2;
const DEFAULT_PAGE_RATIO=1.414;
const MAX_PIXEL_RATIO=1.5;
const SCROLL_IDLE_MS=320;
const NAVIGATION_TIMEOUT_MS=1200;
const DEFAULT_PAGE_SIZE={width:612,height:612*DEFAULT_PAGE_RATIO};

type PageSize={width:number;height:number};
type Props={
 file:string;
 page:number;
 totalPages:number;
 zoom:number;
 rotation:number;
 error:string;
 onError:(error:unknown)=>void;
 onDocumentLoad:(totalPages:number)=>void;
 onDocumentReady?:(document:PDFDocumentProxy)=>void;
 onPageChange:(page:number)=>void;
};
type SlotProps={
 pageNumber:number;
 active:boolean;
 width:number;
 height:number;
 rotation:number;
 generation:number;
 onMeasured:(generation:number,pageNumber:number,size:PageSize)=>void;
};
type ScrollAnchor={page:number;offset:number};

const pageRange=(page:number,totalPages:number)=>{
 const pages=new Set<number>();
 for(let current=Math.max(1,page-OVERSCAN);current<=Math.min(totalPages,page+OVERSCAN);current++)pages.add(current);
 return pages
};
const largestVisiblePage=(viewer:HTMLElement,fallback:number)=>{
 const viewerRect=viewer.getBoundingClientRect();
 let best=fallback,bestArea=0;
 for(const element of viewer.querySelectorAll<HTMLElement>('[data-page]')){
  const rect=element.getBoundingClientRect();
  const width=Math.max(0,Math.min(rect.right,viewerRect.right)-Math.max(rect.left,viewerRect.left));
  const height=Math.max(0,Math.min(rect.bottom,viewerRect.bottom)-Math.max(rect.top,viewerRect.top));
  const area=width*height,number=Number(element.dataset.page);
  if(area>bestArea||(area===bestArea&&area>0&&number===fallback)){best=number;bestArea=area}
 }
 return bestArea?best:fallback
};

const MobilePageSlot=memo(function MobilePageSlot({pageNumber,active,width,height,rotation,generation,onMeasured}:SlotProps){
 return <div id={`pdf-page-${pageNumber}`} data-page={pageNumber} className={`pdf-page mobile-pdf-page-slot ${active?'rendered':'placeholder'}`} style={{width,height,minHeight:height}}>{active?<Page pageNumber={pageNumber} width={width} rotate={rotation} devicePixelRatio={Math.min(window.devicePixelRatio||1,MAX_PIXEL_RATIO)} renderTextLayer={false} renderAnnotationLayer={false} onLoadSuccess={(pdfPage:PDFPageProxy)=>{const viewport=pdfPage.getViewport({scale:1,rotation:0});onMeasured(generation,pageNumber,{width:viewport.width,height:viewport.height})}}/>:<div className="pdf-page-placeholder"><span>Trang {pageNumber}</span></div>}</div>
});

export default memo(function MobileContinuousViewer({file,page,totalPages,zoom,rotation,error,onError,onDocumentLoad,onDocumentReady,onPageChange}:Props){
 const viewerRef=useRef<HTMLElement>(null);
 const mountedRef=useRef(true);
 const pageRef=useRef(page);
 const emittedPage=useRef<number|null>(null);
 const documentGeneration=useRef(0);
 const loadedDocument=useRef<PDFDocumentProxy|null>(null);
 const pageSizesRef=useRef<Record<number,PageSize>>({});
 const deferredSizes=useRef<Record<number,PageSize>|null>(null);
 const pendingAnchor=useRef<ScrollAnchor|null>(null);
 const contentWidthRef=useRef(0);
 const initialPositioned=useRef(false);
 const pointerActive=useRef(false);
 const scrolling=useRef(false);
 const navigationGeneration=useRef(0);
 const navigationTarget=useRef<number|null>(null);
 const navigationFrame=useRef(0);
 const navigationFollowupFrame=useRef(0);
 const navigationSettleFrame=useRef(0);
 const navigationTimer=useRef(0);
 const scrollEndTimer=useRef(0);
 const renderFrame=useRef(0);
 const stableFrame=useRef(0);
 const stableScrollTop=useRef(0);
 const stableFrames=useRef(0);
 const settleRef=useRef<(()=>void)|null>(null);
 const [documentReady,setDocumentReady]=useState(false);
 const [contentWidth,setContentWidth]=useState(0);
 const [nearPages,setNearPages]=useState<Set<number>>(()=>pageRange(page,totalPages));
 const [pageSizes,setPageSizes]=useState<Record<number,PageSize>>({});
 const [defaultSize,setDefaultSize]=useState<PageSize>(DEFAULT_PAGE_SIZE);
 const [viewZoom,setViewZoom]=useState(zoom);
 const [viewRotation,setViewRotation]=useState(rotation);
 pageRef.current=page;

 const slots=useMemo(()=>Array.from({length:totalPages},(_,index)=>index+1),[totalPages]);
 const visiblePage=useCallback(()=>{const viewer=viewerRef.current;return viewer?largestVisiblePage(viewer,pageRef.current):pageRef.current},[]);
 const rememberAnchor=useCallback(()=>{
  const viewer=viewerRef.current;
  if(!viewer)return null;
  const anchorPage=largestVisiblePage(viewer,pageRef.current),element=viewer.querySelector<HTMLElement>(`[data-page="${anchorPage}"]`);
  return element?{page:anchorPage,offset:element.getBoundingClientRect().top-viewer.getBoundingClientRect().top}:null
 },[]);
 const cancelNavigation=useCallback(()=>{
  navigationGeneration.current++;
  navigationTarget.current=null;
  cancelAnimationFrame(navigationFrame.current);
  cancelAnimationFrame(navigationFollowupFrame.current);
  cancelAnimationFrame(navigationSettleFrame.current);
  clearTimeout(navigationTimer.current)
 },[]);
 const applyPageSizes=useCallback((next:Record<number,PageSize>)=>{
  if(!mountedRef.current)return;
  if(pointerActive.current||scrolling.current){deferredSizes.current={...(deferredSizes.current||pageSizesRef.current),...next};return}
  if(initialPositioned.current)pendingAnchor.current=rememberAnchor();
  const merged={...pageSizesRef.current,...next};
  pageSizesRef.current=merged;
  setPageSizes(merged)
 },[rememberAnchor]);
 const recordPageSize=useCallback((generation:number,pageNumber:number,size:PageSize)=>{
  if(!mountedRef.current||!loadedDocument.current||generation!==documentGeneration.current)return;
  const previous=(deferredSizes.current||pageSizesRef.current)[pageNumber];
  if(previous&&Math.abs(previous.width-size.width)<.5&&Math.abs(previous.height-size.height)<.5)return;
  applyPageSizes({[pageNumber]:size})
 },[applyPageSizes]);
 const flushDeferredSizes=useCallback(()=>{
  const deferred=deferredSizes.current;
  if(!deferred)return false;
  deferredSizes.current=null;
  applyPageSizes(deferred);
  return true
 },[applyPageSizes]);
 const applyPendingAnchor=useCallback(()=>{
  if(pointerActive.current||scrolling.current)return;
  const anchor=pendingAnchor.current,viewer=viewerRef.current;
  if(!anchor||!viewer)return;
  pendingAnchor.current=null;
  const element=viewer.querySelector<HTMLElement>(`[data-page="${anchor.page}"]`);
  if(!element)return;
  viewer.scrollTop+=element.getBoundingClientRect().top-viewer.getBoundingClientRect().top-anchor.offset
 },[]);

 useLayoutEffect(()=>{
  if(viewZoom===zoom&&viewRotation===rotation)return;
  cancelNavigation();
  if(initialPositioned.current)pendingAnchor.current=rememberAnchor();
  setViewZoom(zoom);
  setViewRotation(rotation)
 },[cancelNavigation,rememberAnchor,rotation,viewRotation,viewZoom,zoom]);
 useLayoutEffect(()=>{
  if(viewZoom!==zoom||viewRotation!==rotation||pointerActive.current||scrolling.current)return;
  const anchor=pendingAnchor.current,viewer=viewerRef.current;
  if(!anchor||!viewer)return;
  pendingAnchor.current=null;
  const element=viewer.querySelector<HTMLElement>(`[data-page="${anchor.page}"]`);
  if(!element)return;
  viewer.scrollTop+=element.getBoundingClientRect().top-viewer.getBoundingClientRect().top-anchor.offset
 },[contentWidth,defaultSize,pageSizes,rotation,viewRotation,viewZoom,zoom]);

 useEffect(()=>{
  const viewer=viewerRef.current;
  if(!viewer)return;
  const measure=()=>{
   const next=Math.max(0,Math.floor(viewer.clientWidth-24));
   if(Math.abs(contentWidthRef.current-next)<2)return;
   cancelNavigation();
   if(initialPositioned.current)pendingAnchor.current=rememberAnchor();
   contentWidthRef.current=next;
   setContentWidth(next)
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(viewer);
  return()=>observer.disconnect()
 },[cancelNavigation,rememberAnchor]);

 const replaceNearPages=useCallback((center:number)=>{
  setNearPages(current=>{
   const required=pageRange(center,totalPages);
   if(current.size===required.size&&Array.from(required).every(number=>current.has(number)))return current;
   return required
  })
 },[totalPages]);
 const prepareNavigation=useCallback((target:number,current:number)=>{
  setNearPages(previous=>{
   const required=pageRange(target,totalPages);
   for(const number of pageRange(current,totalPages))required.add(number);
   if(previous.size===required.size&&Array.from(required).every(number=>previous.has(number)))return previous;
   return required
  })
 },[totalPages]);
 const targetScrollTop=useCallback((pageNumber:number)=>{
  const viewer=viewerRef.current,target=viewer?.querySelector<HTMLElement>(`[data-page="${pageNumber}"]`);
  if(!viewer||!target)return null;
  return Math.min(Math.max(0,target.offsetTop-12),Math.max(0,viewer.scrollHeight-viewer.clientHeight))
 },[]);
 const targetAligned=useCallback((pageNumber:number)=>{
  const viewer=viewerRef.current,top=targetScrollTop(pageNumber);
  return Boolean(viewer&&top!==null&&Math.abs(viewer.scrollTop-top)<=16)
 },[targetScrollTop]);
 const settleScroll=useCallback(()=>{
  if(!mountedRef.current)return;
  scrolling.current=false;
  flushDeferredSizes();
  applyPendingAnchor();
  const target=navigationTarget.current;
  if(target!==null&&!targetAligned(target))return;
  if(target!==null){navigationTarget.current=null;clearTimeout(navigationTimer.current)}
  const next=visiblePage();
  replaceNearPages(next);
  if(next!==pageRef.current){pageRef.current=next;emittedPage.current=next;onPageChange(next)}
 },[applyPendingAnchor,flushDeferredSizes,onPageChange,replaceNearPages,targetAligned,visiblePage]);
 settleRef.current=settleScroll;
 const settleWhenStable=useCallback(()=>{
  cancelAnimationFrame(stableFrame.current);
  const verify=()=>{
   if(!mountedRef.current||pointerActive.current)return;
   const viewer=viewerRef.current;
   if(!viewer)return;
   if(Math.abs(viewer.scrollTop-stableScrollTop.current)>1){stableScrollTop.current=viewer.scrollTop;stableFrames.current=0;stableFrame.current=requestAnimationFrame(verify);return}
   if(stableFrames.current++<2){stableFrame.current=requestAnimationFrame(verify);return}
   settleRef.current?.()
  };
  stableScrollTop.current=viewerRef.current?.scrollTop||0;
  stableFrames.current=0;
  stableFrame.current=requestAnimationFrame(verify)
 },[]);

 useEffect(()=>{
  const viewer=viewerRef.current;
  if(!viewer)return;
  const scheduleSettle=()=>{if(pointerActive.current)return;clearTimeout(scrollEndTimer.current);scrollEndTimer.current=window.setTimeout(settleWhenStable,SCROLL_IDLE_MS)};
  const scheduleRenderWindow=()=>{if(renderFrame.current)return;renderFrame.current=requestAnimationFrame(()=>{renderFrame.current=0;setNearPages(current=>{const required=pageRange(largestVisiblePage(viewer,pageRef.current),totalPages);if(current.size===required.size&&Array.from(required).every(number=>current.has(number)))return current;return required})})};
  const beginInteraction=()=>{pointerActive.current=true;scrolling.current=true;clearTimeout(scrollEndTimer.current);cancelAnimationFrame(stableFrame.current);cancelNavigation()};
  const endInteraction=()=>{pointerActive.current=false;scheduleSettle()};
  const onScroll=()=>{scrolling.current=true;scheduleRenderWindow();scheduleSettle()};
  const onWheel=()=>{scrolling.current=true;cancelNavigation();scheduleRenderWindow();scheduleSettle()};
  viewer.addEventListener('scroll',onScroll,{passive:true});
  viewer.addEventListener('scrollend',settleWhenStable);
  viewer.addEventListener('pointerdown',beginInteraction,{passive:true});
  window.addEventListener('pointerup',endInteraction,{passive:true});
  window.addEventListener('pointercancel',endInteraction,{passive:true});
  viewer.addEventListener('wheel',onWheel,{passive:true});
  return()=>{
   viewer.removeEventListener('scroll',onScroll);
   viewer.removeEventListener('scrollend',settleWhenStable);
   viewer.removeEventListener('pointerdown',beginInteraction);
   window.removeEventListener('pointerup',endInteraction);
   window.removeEventListener('pointercancel',endInteraction);
   viewer.removeEventListener('wheel',onWheel);
   clearTimeout(scrollEndTimer.current);
   cancelAnimationFrame(renderFrame.current);
   cancelAnimationFrame(stableFrame.current)
  }
 },[cancelNavigation,settleWhenStable]);

 useEffect(()=>{
  if(!contentWidth||!documentReady)return;
  if(emittedPage.current===page){emittedPage.current=null;return}
  if(initialPositioned.current&&targetAligned(page)){navigationTarget.current=null;replaceNearPages(page);return}
  const viewer=viewerRef.current,current=visiblePage();
  if(!viewer)return;
  const generation=++navigationGeneration.current;
  navigationTarget.current=page;
  prepareNavigation(page,current);
  cancelAnimationFrame(navigationFrame.current);
  cancelAnimationFrame(navigationFollowupFrame.current);
  navigationFrame.current=requestAnimationFrame(()=>{
   navigationFollowupFrame.current=requestAnimationFrame(()=>{
    if(!mountedRef.current||generation!==navigationGeneration.current||navigationTarget.current!==page)return;
    const top=targetScrollTop(page);
    if(top===null)return;
    const smooth=initialPositioned.current&&Math.abs(current-page)<=2;
    initialPositioned.current=true;
    viewer.scrollTo({top,behavior:smooth?'smooth':'auto'});
    if(!smooth){navigationSettleFrame.current=requestAnimationFrame(()=>{if(mountedRef.current&&generation===navigationGeneration.current)settleScroll()})}
   })
  });
  clearTimeout(navigationTimer.current);
  navigationTimer.current=window.setTimeout(()=>{
   if(!mountedRef.current||generation!==navigationGeneration.current||navigationTarget.current!==page)return;
   const top=targetScrollTop(page);
   if(top===null)return;
   viewer.scrollTo({top,behavior:'auto'});
   navigationSettleFrame.current=requestAnimationFrame(()=>{if(mountedRef.current&&generation===navigationGeneration.current)settleScroll()})
  },NAVIGATION_TIMEOUT_MS)
 },[contentWidth,documentReady,page,prepareNavigation,replaceNearPages,settleScroll,targetAligned,targetScrollTop,visiblePage]);

 useEffect(()=>{replaceNearPages(pageRef.current)},[replaceNearPages,totalPages]);
 useEffect(()=>{
  mountedRef.current=true;
  return()=>{
   mountedRef.current=false;
   documentGeneration.current++;
   cancelNavigation();
   clearTimeout(scrollEndTimer.current);
   cancelAnimationFrame(renderFrame.current);
   cancelAnimationFrame(stableFrame.current)
  }
 },[cancelNavigation]);
 useEffect(()=>{
  documentGeneration.current++;
  loadedDocument.current=null;
  deferredSizes.current=null;
  cancelNavigation();
  clearTimeout(scrollEndTimer.current);
  cancelAnimationFrame(stableFrame.current);
  pointerActive.current=false;
  scrolling.current=false;
  setNearPages(pageRange(pageRef.current,totalPages));
  pendingAnchor.current=null;
  emittedPage.current=null;
  pageSizesRef.current={};
  initialPositioned.current=false;
  setPageSizes({});
  setDefaultSize(DEFAULT_PAGE_SIZE);
  setDocumentReady(false)
 },[cancelNavigation,file]);

 const handleDocumentError=useCallback((loadError:unknown)=>{if(mountedRef.current)onError(loadError)},[onError]);
 const onLoad=useCallback((pdfDocument:PDFDocumentProxy)=>{
  if(loadedDocument.current===pdfDocument)return;
  loadedDocument.current=pdfDocument;
  const generation=documentGeneration.current,count=Math.max(1,pdfDocument.numPages);
  if(!mountedRef.current||generation!==documentGeneration.current)return;
  onDocumentLoad(count);
  onDocumentReady?.(pdfDocument);
  void (async()=>{
   const measured:Record<number,PageSize>={};
   try{
    for(let start=1;start<=count;start+=12){
     const batch=Array.from({length:Math.min(12,count-start+1)},(_,index)=>start+index);
     const sizes=await Promise.all(batch.map(async number=>{
      const pdfPage=await pdfDocument.getPage(number),viewport=pdfPage.getViewport({scale:1,rotation:0});
      return [number,{width:viewport.width,height:viewport.height}] as const
     }));
     if(!mountedRef.current||generation!==documentGeneration.current)return;
     for(const [number,size] of sizes)measured[number]=size;
     applyPageSizes(measured)
    }
    if(!mountedRef.current||generation!==documentGeneration.current)return;
    const first=measured[1];
    if(first)setDefaultSize(first);
    setDocumentReady(true)
   }catch(loadError){
    if(mountedRef.current&&generation===documentGeneration.current){setDocumentReady(true);onError(loadError)}
   }
  })()
 },[applyPageSizes,onDocumentLoad,onDocumentReady,onError]);

 return <main ref={viewerRef} className="viewer continuous mobile-continuous-viewer"><Document key={file} file={file} loading={<Spin/>} onLoadSuccess={onLoad} onLoadError={handleDocumentError} error={<Alert type="error" message={error}/>}>{contentWidth?slots.map(number=>{const size=pageSizes[number]||defaultSize,rotated=viewRotation%180!==0,baseWidth=rotated?size.height:size.width,baseHeight=rotated?size.width:size.height,width=contentWidth*viewZoom,height=width*(baseHeight/baseWidth);return <MobilePageSlot key={number} pageNumber={number} active={nearPages.has(number)} width={width} height={height} rotation={viewRotation} generation={documentGeneration.current} onMeasured={recordPageSize}/>}):null}</Document></main>
});
