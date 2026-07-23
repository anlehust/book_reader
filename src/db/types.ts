export type HighlightColor = 'yellow' | 'green' | 'pink' | 'orange';
export interface Book { id:string; title:string; fileName:string; fileUrl:string; fileSize:number; totalPages:number; currentPage:number; addedAt:number; lastReadAt:number; rotation:number; }
export interface LocalBook extends Omit<Book,'fileUrl'|'fileSize'> { fileData:ArrayBuffer; }
export interface Bookmark { id:string; bookId:string; page:number; note?:string; createdAt:number; }
export interface Highlight { id:string; bookId:string; page:number; text:string; color:HighlightColor; note?:string; createdAt:number; }
export interface VocabWord { id:string; bookId:string; word:string; meaning:string; example?:string; page:number; createdAt:number; }
export interface BackupBook extends Omit<LocalBook, 'fileData'> { fileData:string; }
export interface BackupData { version:1; exportedAt:number; books:BackupBook[]; bookmarks:Bookmark[]; highlights:Highlight[]; vocabulary:VocabWord[]; }
