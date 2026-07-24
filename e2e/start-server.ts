import fs from 'node:fs';
import path from 'node:path';
import {buildApp} from '../server/app.js';

const dataDir=path.resolve('test-results/e2e-data');
fs.rmSync(dataDir,{recursive:true,force:true});

const app=await buildApp({dataDir,serveStatic:false});
await app.listen({host:'127.0.0.1',port:3100});
