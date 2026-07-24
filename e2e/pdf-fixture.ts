export function createPdfBuffer(pageCount=15){
 const objects:string[]=[];
 const pageObjects=Array.from({length:pageCount},(_,index)=>3+index*2);
 const fontObject=3+pageCount*2;
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
 objects[2]=`<< /Type /Pages /Kids [${pageObjects.map(number=>`${number} 0 R`).join(' ')}] /Count ${pageCount} >>`;
 for(let index=0;index<pageCount;index++){
  const pageObject=pageObjects[index],contentObject=pageObject+1;
  const stream=`BT /F1 24 Tf 72 720 Td (E2E page ${index+1}) Tj ET`;
  objects[pageObject]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`;
  objects[contentObject]=`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
 }
 objects[fontObject]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
 const chunks=[Buffer.from('%PDF-1.4\n')],offsets=[0];
 let position=chunks[0].length;
 for(let number=1;number<objects.length;number++){
  const chunk=Buffer.from(`${number} 0 obj\n${objects[number]}\nendobj\n`);
  offsets[number]=position;
  chunks.push(chunk);
  position+=chunk.length
 }
 const xref=position;
 const entries=offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('');
 chunks.push(Buffer.from(`xref\n0 ${objects.length}\n0000000000 65535 f \n${entries}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
 return Buffer.concat(chunks)
}
