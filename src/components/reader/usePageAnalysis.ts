import {useEffect,useState} from 'react';
import type {PDFDocumentProxy} from 'pdfjs-dist';
import type {VocabWord} from '../../db/types';
import {loadCEFRData} from '../../services/cefrData';
import {extractPageText} from '../../services/extractPageText';
import {analyzePage,type SuggestionResult} from '../../services/suggestionEngine';

const empty:SuggestionResult={newWords:[],savedOnPage:[]};
export function usePageAnalysis(document:PDFDocumentProxy|null,page:number,enabled:boolean,savedWords:VocabWord[],knownLemmas:Set<string>){
 const [result,setResult]=useState<SuggestionResult>(empty),[loading,setLoading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!enabled||!document){setResult(empty);setLoading(false);setError('');return}const controller=new AbortController();let current=true;setLoading(true);setError('');void (async()=>{try{await loadCEFRData('B1');const text=await extractPageText(document,page,controller.signal);if(current)setResult(analyzePage(text,'B1',savedWords,knownLemmas))}catch(reason){if(current&&!(reason instanceof DOMException&&reason.name==='AbortError')){console.error('Không thể phân tích trang',{page,reason});setResult(empty);setError('Không thể phân tích từ vựng trên trang này')}}finally{if(current)setLoading(false)}})();return()=>{current=false;controller.abort()}},[document,enabled,knownLemmas,page,savedWords]);
 return {...result,loading,error}
}
