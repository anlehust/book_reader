export async function translateText(text:string,from='en',to='vi',signal?:AbortSignal):Promise<string>{
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),5000); const abort=()=>controller.abort(); signal?.addEventListener('abort',abort);
 try { const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`; const response=await fetch(url,{signal:controller.signal}); if(!response.ok)throw new Error('Không thể kết nối dịch vụ dịch'); const json=await response.json() as {responseData?:{translatedText?:string}}; return json.responseData?.translatedText?.trim()||''; }
 finally {clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
