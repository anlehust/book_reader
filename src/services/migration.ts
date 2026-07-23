import {db} from '../db/database';
import {repositories} from '../db/repositories';

export async function pendingLegacyBookCount(){
 try{
  const [localBooks,remoteBooks]=await Promise.all([db.books.toArray(),repositories.books.all()]);
  const remoteIds=new Set(remoteBooks.map(book=>book.id));
  return localBooks.filter(book=>!remoteIds.has(book.id)).length
 }catch{return 0}
}

export async function migrateLegacyData(onProgress?:(done:number,total:number)=>void){
 const books=await db.books.toArray(),remoteIds=new Set((await repositories.books.all()).map(book=>book.id));
 let done=0;
 for(const book of books){
  if(!remoteIds.has(book.id)){
   const file=new File([book.fileData],book.fileName,{type:'application/pdf'});
   await repositories.books.add({id:book.id,file,title:book.title,totalPages:book.totalPages});
   await repositories.books.progress(book.id,book.currentPage);
   await repositories.books.rotation(book.id,book.rotation);
   const [bookmarks,highlights,vocabulary]=await Promise.all([db.bookmarks.where('bookId').equals(book.id).toArray(),db.highlights.where('bookId').equals(book.id).toArray(),db.vocabulary.where('bookId').equals(book.id).toArray()]);
   for(const bookmark of bookmarks)await fetch(`/api/books/${book.id}/bookmarks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bookmark)}).then(response=>{if(!response.ok)throw new Error('Không thể chuyển bookmark')});
   for(const highlight of highlights)await fetch(`/api/books/${book.id}/highlights`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(highlight)}).then(response=>{if(!response.ok)throw new Error('Không thể chuyển highlight')});
   for(const word of vocabulary)await fetch(`/api/books/${book.id}/vocabulary`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(word)}).then(response=>{if(!response.ok)throw new Error('Không thể chuyển từ mới')});
  }
  onProgress?.(++done,books.length)
 }
 return books.length
}
