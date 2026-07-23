import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type ServerDatabase=Database.Database;

const schema=`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS books (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, file_name TEXT NOT NULL, total_pages INTEGER NOT NULL,
 current_page INTEGER NOT NULL DEFAULT 1, rotation INTEGER NOT NULL DEFAULT 0,
 added_at INTEGER NOT NULL, last_read_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 file_size INTEGER NOT NULL, sha256 TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE, page INTEGER NOT NULL, created_at INTEGER NOT NULL, UNIQUE(book_id,page));
CREATE TABLE IF NOT EXISTS highlights (id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE, page INTEGER NOT NULL, text TEXT NOT NULL, color TEXT NOT NULL, note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS vocabulary (id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE, word TEXT NOT NULL, meaning TEXT NOT NULL, example TEXT, page INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book ON bookmarks(book_id);
CREATE INDEX IF NOT EXISTS idx_highlights_book ON highlights(book_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_book ON vocabulary(book_id);
`;

export function openDatabase(dataDir=process.env.DATA_DIR||path.resolve('data')){
 fs.mkdirSync(dataDir,{recursive:true});
 const database=new Database(path.join(dataDir,'library.sqlite'));
 database.pragma('foreign_keys = ON'); database.pragma('journal_mode = WAL'); database.exec(schema);
 return database;
}
