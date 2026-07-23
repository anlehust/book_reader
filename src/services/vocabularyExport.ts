import type {VocabWord} from '../db/types';

export type VocabularyExportFormat='json'|'csv';

type ExportedVocabulary=Pick<VocabWord,'word'|'meaning'|'example'|'page'|'createdAt'>;

const columns:(keyof ExportedVocabulary)[]=['word','meaning','example','page','createdAt'];
const exportedWords=(words:VocabWord[]):ExportedVocabulary[]=>words.map(({word,meaning,example,page,createdAt})=>({word,meaning,example:example||'',page,createdAt}));
const csvValue=(value:string|number|undefined)=>{const text=String(value??'');return /[",\r\n]/.test(text)?`"${text.replaceAll('"','""')}"`:text};

export const serializeVocabularyJson=(words:VocabWord[])=>JSON.stringify(exportedWords(words),null,2);
export const serializeVocabularyCsv=(words:VocabWord[])=>`﻿${[columns.join(','),...exportedWords(words).map(word=>columns.map(column=>csvValue(word[column])).join(','))].join('\r\n')}`;

export const vocabularyFilename=(bookTitle:string,format:VocabularyExportFormat,date=new Date())=>{
 const slug=bookTitle.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'sach';
 return `tu-moi-${slug}-${date.toISOString().slice(0,10)}.${format}`
};

export function downloadVocabulary(words:VocabWord[],format:VocabularyExportFormat,bookTitle:string){
 const content=format==='json'?serializeVocabularyJson(words):serializeVocabularyCsv(words);
 const type=format==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8';
 const url=URL.createObjectURL(new Blob([content],{type}));
 const anchor=document.createElement('a');
 anchor.href=url;
 anchor.download=vocabularyFilename(bookTitle,format);
 anchor.click();
 URL.revokeObjectURL(url)
}
