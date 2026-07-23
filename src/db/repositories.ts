import type {Book,Bookmark,Highlight,VocabWord} from './types';

export class ApiError extends Error{constructor(message:string,readonly status:number){super(message)}}
const request=async<T>(url:string,init?:RequestInit):Promise<T>=>{let response:Response;try{response=await fetch(url,init)}catch{throw new ApiError('Không kết nối được máy chủ ReadFlow',0)}if(!response.ok){let message=`Yêu cầu thất bại (${response.status})`;try{message=((await response.json()) as {error?:{message?:string}}).error?.message||message}catch{/* response is not JSON */}throw new ApiError(message,response.status)}return response.status===204?undefined as T:response.json() as Promise<T>};
const json=(method:string,body?:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});

export const repositories={
 books:{
  all:()=>request<Book[]>('/api/books'),
  get:(key:string)=>request<Book>(`/api/books/${encodeURIComponent(key)}`).catch(error=>{if(error instanceof ApiError&&error.status===404)return undefined;throw error}),
  add:async(data:{file:File;title:string;totalPages:number;id?:string})=>{const form=new FormData();form.append('file',data.file);form.append('title',data.title);form.append('totalPages',String(data.totalPages));if(data.id)form.append('id',data.id);return request<Book>('/api/books',{method:'POST',body:form})},
  rename:(key:string,title:string)=>request<void>(`/api/books/${encodeURIComponent(key)}`,json('PATCH',{title})),
  progress:(key:string,page:number)=>request<void>(`/api/books/${encodeURIComponent(key)}/progress`,json('PUT',{page})),
  rotation:(key:string,rotation:number)=>request<void>(`/api/books/${encodeURIComponent(key)}/rotation`,json('PUT',{rotation})),
  remove:(key:string)=>request<void>(`/api/books/${encodeURIComponent(key)}`,{method:'DELETE'}),
 },
 bookmarks:{
  count:()=>request<{bookmarks:number;vocabulary:number}>('/api/stats').then(stats=>stats.bookmarks),
  forBook:(bookId:string)=>request<Bookmark[]>(`/api/books/${encodeURIComponent(bookId)}/bookmarks`),
  toggle:(bookId:string,page:number)=>request<{active:boolean}>(`/api/books/${encodeURIComponent(bookId)}/bookmarks/toggle`,json('POST',{page})).then(result=>result.active),
  remove:(key:string)=>request<void>(`/api/bookmarks/${encodeURIComponent(key)}`,{method:'DELETE'}),
 },
 highlights:{
  forBook:(bookId:string)=>request<Highlight[]>(`/api/books/${encodeURIComponent(bookId)}/highlights`),
  add:(data:Omit<Highlight,'id'|'createdAt'>)=>request<Highlight>(`/api/books/${encodeURIComponent(data.bookId)}/highlights`,json('POST',data)),
  update:(key:string,changes:Partial<Pick<Highlight,'note'|'color'>>)=>request<void>(`/api/highlights/${encodeURIComponent(key)}`,json('PATCH',changes)),
  remove:(key:string)=>request<void>(`/api/highlights/${encodeURIComponent(key)}`,{method:'DELETE'}),
 },
 vocabulary:{
  count:()=>request<{bookmarks:number;vocabulary:number}>('/api/stats').then(stats=>stats.vocabulary),
  forBook:(bookId:string)=>request<VocabWord[]>(`/api/books/${encodeURIComponent(bookId)}/vocabulary`),
  add:(data:Omit<VocabWord,'id'|'createdAt'|'word'> & {word:string})=>request<VocabWord>(`/api/books/${encodeURIComponent(data.bookId)}/vocabulary`,json('POST',data)),
  update:(key:string,changes:Partial<Pick<VocabWord,'word'|'meaning'|'example'>>)=>request<void>(`/api/vocabulary/${encodeURIComponent(key)}`,json('PATCH',changes)),
  remove:(key:string)=>request<void>(`/api/vocabulary/${encodeURIComponent(key)}`,{method:'DELETE'}),
 },
};
