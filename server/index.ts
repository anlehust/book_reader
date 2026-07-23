import {buildApp} from './app.js';

const app=await buildApp();
const host=process.env.HOST||'0.0.0.0';
const port=Number(process.env.PORT)||3000;
try{await app.listen({host,port});console.log(`ReadFlow: http://localhost:${port}`)}catch(error){app.log.error(error);process.exit(1)}
