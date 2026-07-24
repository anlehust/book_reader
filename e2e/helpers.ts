import {expect} from '@playwright/test';
import type {APIRequestContext} from '@playwright/test';
import {createPdfBuffer} from './pdf-fixture';

export const PDF_PAGE_COUNT=15;

export async function resetLibrary(request:APIRequestContext){
 const response=await request.get('/api/books');
 expect(response.ok()).toBeTruthy();
 const books=await response.json() as Array<{id:string}>;
 for(const book of books){
  const removed=await request.delete(`/api/books/${book.id}`);
  expect([204,404]).toContain(removed.status())
 }
 const empty=await request.get('/api/books');
 expect(await empty.json()).toEqual([])
}

export async function seedBook(request:APIRequestContext,id:string,title='E2E Reader'){
 const response=await request.post('/api/books',{multipart:{id,title,totalPages:String(PDF_PAGE_COUNT),file:{name:'reader-15-pages.pdf',mimeType:'application/pdf',buffer:createPdfBuffer(PDF_PAGE_COUNT)}}});
 expect(response.status()).toBe(201);
 return await response.json() as {id:string;title:string;totalPages:number}
}

export function testBookId(project:string,title:string){
 return `e2e-${project}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80)
}
