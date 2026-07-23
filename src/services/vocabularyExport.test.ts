import {describe,expect,it} from 'vitest';
import type {VocabWord} from '../db/types';
import {serializeVocabularyCsv,serializeVocabularyJson,vocabularyFilename} from './vocabularyExport';

const words:VocabWord[]=[
 {id:'1',bookId:'book-1',word:'hello',meaning:'xin chào, bạn',example:'She said "hello".\nThen waved.',page:3,createdAt:100},
 {id:'2',bookId:'book-1',word:'book',meaning:'quyển sách',page:0,createdAt:200},
];

describe('vocabulary export',()=>{
 it('serializes useful vocabulary fields as formatted JSON',()=>{
  expect(JSON.parse(serializeVocabularyJson(words))).toEqual([
   {word:'hello',meaning:'xin chào, bạn',example:'She said "hello".\nThen waved.',page:3,createdAt:100},
   {word:'book',meaning:'quyển sách',example:'',page:0,createdAt:200},
  ])
 });

 it('serializes spreadsheet-compatible CSV with escaped values',()=>{
  expect(serializeVocabularyCsv(words)).toBe('﻿word,meaning,example,page,createdAt\r\nhello,"xin chào, bạn","She said ""hello"".\nThen waved.",3,100\r\nbook,quyển sách,,0,200')
 });

 it('creates safe dated filenames for both formats',()=>{
  const date=new Date('2026-07-23T12:00:00.000Z');
  expect(vocabularyFilename('Dế Mèn: Phiêu lưu ký?', 'json',date)).toBe('tu-moi-de-men-phieu-luu-ky-2026-07-23.json');
  expect(vocabularyFilename('***','csv',date)).toBe('tu-moi-sach-2026-07-23.csv')
 });
});
