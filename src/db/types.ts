export type HighlightColor = 'yellow' | 'green' | 'pink' | 'orange';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export interface Book { id:string; title:string; fileName:string; fileUrl:string; fileSize:number; totalPages:number; currentPage:number; addedAt:number; lastReadAt:number; rotation:number; }
export interface LocalBook extends Omit<Book,'fileUrl'|'fileSize'> { fileData:ArrayBuffer; }
export interface Bookmark { id:string; bookId:string; page:number; note?:string; createdAt:number; }
export interface Highlight { id:string; bookId:string; page:number; text:string; color:HighlightColor; note?:string; createdAt:number; }
export interface VocabWord { id:string; bookId:string; word:string; meaning:string; example?:string; page:number; createdAt:number; }
export interface KnownWord { lemma:string; createdAt:number; }
export interface ReaderSettings { aiSuggestionEnabled:boolean; userLevel:'B1'; }
export interface BackupBook extends Omit<LocalBook, 'fileData'> { fileData:string; }
export interface BackupData { version:1; exportedAt:number; books:BackupBook[]; bookmarks:Bookmark[]; highlights:Highlight[]; vocabulary:VocabWord[]; }
