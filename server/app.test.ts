// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';
import {buildApp} from './app.js';

const dirs:string[]=[];
const setup=async()=>{const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'readflow-'));dirs.push(dataDir);return {app:await buildApp({dataDir,serveStatic:false}),dataDir}};
afterEach(()=>{for(const dir of dirs.splice(0))fs.rmSync(dir,{recursive:true,force:true})});

describe('shared storage API',()=>{
 it('uploads, lists and streams a PDF',async()=>{const {app}=await setup();const body=Buffer.concat([Buffer.from('--x\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest book\r\n--x\r\nContent-Disposition: form-data; name="totalPages"\r\n\r\n2\r\n--x\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-test\r\n--x--\r\n')]);const upload=await app.inject({method:'POST',url:'/api/books',headers:{'content-type':'multipart/form-data; boundary=x'},payload:body});expect(upload.statusCode).toBe(201);const book=upload.json();expect((await app.inject('/api/books')).json()).toHaveLength(1);const pdf=await app.inject(`/api/books/${book.id}/file`);expect(pdf.statusCode).toBe(200);expect(pdf.rawPayload.subarray(0,5).toString()).toBe('%PDF-');await app.close()});
 it('shares vocabulary and cascades book deletion',async()=>{const {app}=await setup();const body=Buffer.from('--x\r\nContent-Disposition: form-data; name="title"\r\n\r\nBook\r\n--x\r\nContent-Disposition: form-data; name="totalPages"\r\n\r\n1\r\n--x\r\nContent-Disposition: form-data; name="file"; filename="a.pdf"\r\n\r\n%PDF-x\r\n--x--\r\n');const book=(await app.inject({method:'POST',url:'/api/books',headers:{'content-type':'multipart/form-data; boundary=x'},payload:body})).json();expect((await app.inject({method:'POST',url:`/api/books/${book.id}/vocabulary`,payload:{word:'Hello',meaning:'xin chào',page:1}})).statusCode).toBe(201);expect((await app.inject(`/api/books/${book.id}/vocabulary`)).json()[0].word).toBe('hello');await app.inject({method:'DELETE',url:`/api/books/${book.id}`});expect((await app.inject(`/api/books/${book.id}/vocabulary`)).json()).toEqual([]);await app.close()});
});
