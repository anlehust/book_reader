import {afterEach,describe,expect,it} from 'vitest';
import type {VocabWord} from '../db/types';
import {resetCEFRDataForTests,seedCEFRDataForTests} from './cefrData';
import {analyzePage} from './suggestionEngine';
import {lemmatize} from './linguistics';

const saved=(word:string,meaning='đã lưu'):VocabWord=>({id:word,bookId:'book',word,meaning,page:1,createdAt:1});

describe('suggestion engine',()=>{
 afterEach(resetCEFRDataForTests);
 it('lemmatizes plural and verb forms',()=>{expect(lemmatize('boxes')).toBe('box');expect(lemmatize('studies')).toBe('study');expect(lemmatize('children')).toBe('child');expect(lemmatize('knives')).toBe('knife');expect(lemmatize('news')).toBe('news')});
 it('filters above B1, known words and deduplicates inflections',()=>{seedCEFRDataForTests([{word:'deploy',level:'B2',pos:'v',vi:''},{word:'easy',level:'A2',pos:'adj',vi:'dễ'},{word:'mitigate',level:'C1',pos:'v',vi:'giảm nhẹ'}]);const result=analyzePage('Deployed deploys easy mitigate.','B1',[],['mitigate']);expect(result.newWords).toHaveLength(1);expect(result.newWords[0]).toMatchObject({lemma:'deploy',surface:'deploy',meaning:'Chưa có nghĩa'})});
 it('puts saved words after new suggestions',()=>{seedCEFRDataForTests([{word:'concurrent',level:'B2',pos:'adj',vi:''},{word:'deploy',level:'B2',pos:'v',vi:''}]);const result=analyzePage('Concurrent systems deploy quickly.','B1',[saved('deploy','triển khai')],[]);expect(result.newWords.map(word=>word.lemma)).toEqual(['concurrent']);expect(result.savedOnPage.map(word=>word.lemma)).toEqual(['deploy'])});
 it('matches saved singular words against plural words on the page',()=>{seedCEFRDataForTests([{word:'breadcrumb',level:'B2',pos:'n',vi:'đường dẫn phân cấp'}]);const result=analyzePage('Breadcrumbs show the current location.','B1',[saved('breadcrumb','đường dẫn phân cấp')],[]);expect(result.newWords).toHaveLength(0);expect(result.savedOnPage.map(word=>word.lemma)).toEqual(['breadcrumb'])});
 it('detects saved words even when they are not CEFR suggestions',()=>{const result=analyzePage('Breadcrumbs show the current location.','B1',[saved('breadcrumb','đường dẫn phân cấp')],[]);expect(result.newWords).toHaveLength(0);expect(result.savedOnPage.map(word=>word.word)).toEqual(['breadcrumb'])});
 it('detects saved phrases with boundaries, casing and flexible whitespace',()=>{const phrase=saved('take into account');expect(analyzePage('We TAKE   INTO ACCOUNT the result.','B1',[phrase],[]).savedOnPage).toHaveLength(1);expect(analyzePage('A mistaken into accounting example.','B1',[phrase],[]).savedOnPage).toHaveLength(0)});
 it('matches saved phrases with inflected words on the page',()=>{const result=analyzePage('These breadcrumb trails helped users navigate.','B1',[saved('breadcrumbs trail','đường dẫn phân cấp')],[]);expect(result.savedOnPage.map(word=>word.word)).toEqual(['breadcrumbs trail'])});
});
