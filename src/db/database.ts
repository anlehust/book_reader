import Dexie, { type EntityTable } from 'dexie';
import type { Book, Bookmark, Highlight, VocabWord } from './types';
export class ReadFlowDB extends Dexie {
  books!: EntityTable<Book,'id'>; bookmarks!:EntityTable<Bookmark,'id'>; highlights!:EntityTable<Highlight,'id'>; vocabulary!:EntityTable<VocabWord,'id'>;
  constructor(name='ReadFlowDB') { super(name); this.version(1).stores({ books:'id,title,addedAt,lastReadAt', bookmarks:'id,bookId,[bookId+page],createdAt', highlights:'id,bookId,page,createdAt', vocabulary:'id,bookId,word,page,createdAt' }); }
}
export const db = new ReadFlowDB();
