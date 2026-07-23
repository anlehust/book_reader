import {describe,expect,it} from 'vitest';
import {clampPage,largestVisiblePage} from './ReaderPage';

const rect=(top:number,bottom:number,left=0,right=100)=>({top,bottom,left,right});

describe('continuous page geometry',()=>{
 it('chooses the page with the largest visible area',()=>{
  const viewer=rect(0,100);
  expect(largestVisiblePage(viewer,[{page:1,rect:rect(0,60)},{page:2,rect:rect(60,160)}],1)).toBe(1);
  expect(largestVisiblePage(viewer,[{page:1,rect:rect(-80,20)},{page:2,rect:rect(20,120)}],1)).toBe(2);
 });
 it('keeps the current page on an equal-area tie',()=>{
  expect(largestVisiblePage(rect(0,100),[{page:1,rect:rect(0,50)},{page:2,rect:rect(50,150)}],2)).toBe(2);
 });
 it('keeps the current page when no page is visible',()=>{
  expect(largestVisiblePage(rect(0,100),[{page:1,rect:rect(-200,-100)}],1)).toBe(1);
 });
});

describe('Reader page normalization',()=>{
 it('clamps invalid page values to the first page',()=>{
  expect(clampPage(0,20)).toBe(1);
  expect(clampPage(-4,20)).toBe(1);
  expect(clampPage(Number.NaN,20)).toBe(1);
 });

 it('clamps values above the PDF page count',()=>{
  expect(clampPage(25,20)).toBe(20);
  expect(clampPage(7.9,20)).toBe(7);
 });

 it('keeps valid pages and handles invalid page counts',()=>{
  expect(clampPage(8,20)).toBe(8);
  expect(clampPage(8,0)).toBe(1);
  expect(clampPage(8,-3)).toBe(1);
 });
});
