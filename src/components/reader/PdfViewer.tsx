import {memo,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Alert,Spin} from 'antd';
import {Document,Page} from 'react-pdf';
import type {PDFDocumentProxy} from 'pdfjs-dist';

const OVERSCAN=2;
const DEFAULT_PAGE_RATIO=1.414;
const MAX_PIXEL_RATIO=2;

type PageSize={width:number;height:number};
type Props={
 file:{data:ArrayBuffer};
 totalPages:number;
 page:number;
 zoom:number;
 rotation:number;
 mode:'page'|'continuous';
 error:string;
 onError:(error:unknown)=>void;
 onPageChange:(page:number)=>void;
 onTextSelected:(text:string,page:number)=>void;
};

type SlotProps={
 pageNumber:number;
 active:boolean;
 zoom:number;
 rotation:number;
 size:PageSize;
 onMeasured:(page:number,size:PageSize)=>void;
};

const PdfPageSlot=memo(function PdfPageSlot({pageNumber,active,zoom,rotation,size,onMeasured}:SlotProps){
 const rotated=rotation%180!==0;
 const width=(rotated?size.height:size.width)*zoom;
 const height=(rotated?size.width:size.height)*zoom;
 return <div id={`pdf-page-${pageNumber}`} data-page={pageNumber} className={`pdf-page pdf-page-slot ${active?'rendered':'placeholder'}`} style={{width,height,minHeight:height}}>{active?<Page pageNumber={pageNumber} scale={zoom} rotate={rotation} devicePixelRatio={Math.min(window.devicePixelRatio||1,MAX_PIXEL_RATIO)} renderTextLayer renderAnnotationLayer onLoadSuccess={pdfPage=>{const viewport=pdfPage.getViewport({scale:1,rotation:0});onMeasured(pageNumber,{width:viewport.width,height:viewport.height})}}/>:<div className="pdf-page-placeholder"><span>Trang {pageNumber}</span></div>}</div>;
});

export default memo(function PdfViewer({file,totalPages,page,zoom,rotation,mode,error,onError,onPageChange,onTextSelected}:Props){
 const viewerRef=useRef<HTMLDivElement>(null);
 const pageRef=useRef(page);
 const modeGeneration=useRef(0);
 const navigationTarget=useRef<number|null>(null);
 const [nearPages,setNearPages]=useState<Set<number>>(()=>new Set([page]));
 const [pageSizes,setPageSizes]=useState<Record<number,PageSize>>({});
 const [defaultSize,setDefaultSize]=useState<PageSize>({width:612,height:612*DEFAULT_PAGE_RATIO});
 pageRef.current=page;

 const measurePage=useCallback((pageNumber:number,size:PageSize)=>{
  setPageSizes(current=>{const old=current[pageNumber];if(old&&Math.abs(old.width-size.width)<.5&&Math.abs(old.height-size.height)<.5)return current;return {...current,[pageNumber]:size}});
  if(pageNumber===1)setDefaultSize(size);
 },[]);

 const updateCurrentPage=useCallback((next:number)=>{
  if(next!==pageRef.current){pageRef.current=next;onPageChange(next)}
 },[onPageChange]);

 useEffect(()=>{
  if(mode!=='continuous'||!viewerRef.current)return;
  const viewer=viewerRef.current;
  const generation=++modeGeneration.current;
  navigationTarget.current=pageRef.current;
  setNearPages(current=>{const next=new Set(current);for(let n=Math.max(1,pageRef.current-OVERSCAN);n<=Math.min(totalPages,pageRef.current+OVERSCAN);n++)next.add(n);return next});
  let trackingObserver:IntersectionObserver|undefined;
  let renderObserver:IntersectionObserver|undefined;
  const frame=window.requestAnimationFrame(()=>{
   if(generation!==modeGeneration.current)return;
   const target=viewer.querySelector<HTMLElement>(`[data-page="${pageRef.current}"]`);
   if(target)viewer.scrollTop=Math.max(0,target.offsetTop-32);
   renderObserver=new IntersectionObserver(entries=>{
    if(generation!==modeGeneration.current)return;
    setNearPages(current=>{
     const next=new Set(current);
     let changed=false;
     for(const entry of entries){
      const number=Number((entry.target as HTMLElement).dataset.page);
      if(entry.isIntersecting){for(let n=Math.max(1,number-OVERSCAN);n<=Math.min(totalPages,number+OVERSCAN);n++){if(!next.has(n)){next.add(n);changed=true}}}
      else if(number!==pageRef.current&&number!==navigationTarget.current&&next.has(number)){next.delete(number);changed=true}
     }
     return changed?next:current;
    })
   },{root:viewer,rootMargin:'120% 0px',threshold:0});
   trackingObserver=new IntersectionObserver(entries=>{
    if(generation!==modeGeneration.current||navigationTarget.current!==null)return;
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)updateCurrentPage(Number((visible.target as HTMLElement).dataset.page))
   },{root:viewer,threshold:[.25,.5,.75]});
   viewer.querySelectorAll('[data-page]').forEach(element=>{renderObserver?.observe(element);trackingObserver?.observe(element)});
   window.requestAnimationFrame(()=>{if(generation===modeGeneration.current)navigationTarget.current=null});
  });
  return()=>{modeGeneration.current++;window.cancelAnimationFrame(frame);renderObserver?.disconnect();trackingObserver?.disconnect()}
 },[mode,totalPages,updateCurrentPage]);

 useEffect(()=>{
  if(mode!=='continuous'||!viewerRef.current)return;
  const target=viewerRef.current.querySelector<HTMLElement>(`[data-page="${page}"]`);
  if(!target)return;
  navigationTarget.current=page;
  setNearPages(current=>{const next=new Set(current);for(let n=Math.max(1,page-OVERSCAN);n<=Math.min(totalPages,page+OVERSCAN);n++)next.add(n);return next});
  const frame=window.requestAnimationFrame(()=>{
   target.scrollIntoView({behavior:'smooth',block:'start'});
   window.setTimeout(()=>{if(navigationTarget.current===page)navigationTarget.current=null},350)
  });
  return()=>window.cancelAnimationFrame(frame)
 },[mode,page,totalPages]);

 const onMouseUp=useCallback((event:React.MouseEvent<HTMLElement>)=>{
  const text=window.getSelection()?.toString().trim()||'';
  if(!text)return;
  const pageElement=(event.target as HTMLElement).closest<HTMLElement>('[data-page]');
  onTextSelected(text.slice(0,500),Number(pageElement?.dataset.page)||pageRef.current)
 },[onTextSelected]);

 const slots=useMemo(()=>Array.from({length:totalPages},(_,index)=>index+1),[totalPages]);
 return <main ref={viewerRef} className={`viewer ${mode}`} onMouseUp={onMouseUp}><Document file={file} loading={<Spin/>} onLoadSuccess={(document:PDFDocumentProxy)=>{void document.getPage(1).then(first=>{const viewport=first.getViewport({scale:1,rotation:0});setDefaultSize({width:viewport.width,height:viewport.height})})}} onLoadError={onError} error={<Alert type="error" message={error}/>}>{mode==='page'?<PdfPageSlot pageNumber={page} active zoom={zoom} rotation={rotation} size={pageSizes[page]||defaultSize} onMeasured={measurePage}/>:slots.map(number=><PdfPageSlot key={number} pageNumber={number} active={nearPages.has(number)||Math.abs(number-page)<=OVERSCAN} zoom={zoom} rotation={rotation} size={pageSizes[number]||defaultSize} onMeasured={measurePage}/>)}</Document></main>;
});
