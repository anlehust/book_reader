import type {CEFRLevel,VocabWord} from '../db/types';
import {getCEFREntry,isAboveLevel,type CEFREntry} from './cefrData';
import {canonicalize,lemmaCandidates,lemmatize,tokenize} from './linguistics';

export interface SuggestedWord extends CEFREntry {lemma:string;surface:string;meaning:string}
export interface SavedOnPage {lemma:string;word:string;meaning:string;source:VocabWord}
export interface SuggestionResult {newWords:SuggestedWord[];savedOnPage:SavedOnPage[]}

const phrasePattern=(phrase:string)=>new RegExp(`(?:^|[^\\p{L}])${phrase.split(/\s+/).map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+')}(?=$|[^\\p{L}])`,'iu');
const intersects=(left:string[],right:string[])=>left.some(item=>right.includes(item));
const phraseOnPage=(phrase:string,pageTokens:ReturnType<typeof tokenize>,normalizedPage:string)=>{
 if(phrasePattern(phrase).test(normalizedPage))return true;
 const phraseTokens=tokenize(phrase);
 if(!phraseTokens.length||phraseTokens.length>pageTokens.length)return false;
 const phraseCandidates=phraseTokens.map(token=>lemmaCandidates(token.normalized));
 const pageCandidates=pageTokens.map(token=>lemmaCandidates(token.normalized));
 for(let start=0;start<=pageCandidates.length-phraseCandidates.length;start++){
  if(phraseCandidates.every((candidates,index)=>intersects(candidates,pageCandidates[start+index])))return true
 }
 return false
};

export function analyzePage(pageText:string,userLevel:CEFRLevel,savedWords:VocabWord[],knownLemmas:Iterable<string>):SuggestionResult{
 const known=new Set(Array.from(knownLemmas,canonicalize));
 const tokens=tokenize(pageText),seen=new Map<string,string>(),seenCandidates=new Set<string>();
 for(const token of tokens){
  const candidates=lemmaCandidates(token.normalized);
  for(const candidate of candidates)seenCandidates.add(candidate);
  const resolved=candidates.find(candidate=>getCEFREntry(candidate))??token.lemma;
  if(!seen.has(resolved))seen.set(resolved,token.normalized)
 }
 const savedSingles=new Map<string,VocabWord>(),savedPhrases:VocabWord[]=[];
 for(const word of savedWords){const normalized=canonicalize(word.word);if(normalized.includes(' '))savedPhrases.push(word);else for(const candidate of lemmaCandidates(normalized))savedSingles.set(candidate,word)}
 const newWords:SuggestedWord[]=[],savedOnPage:SavedOnPage[]=[],savedIdsOnPage=new Set<string>();
 for(const [candidate,saved] of savedSingles){if(!savedIdsOnPage.has(saved.id)&&!known.has(candidate)&&seenCandidates.has(candidate)){savedIdsOnPage.add(saved.id);savedOnPage.push({lemma:candidate,word:saved.word,meaning:saved.meaning,source:saved})}}
 for(const [lemma,surface] of seen){const entry=getCEFREntry(lemma);if(!entry||!isAboveLevel(entry.level,userLevel)||known.has(lemma))continue;if(savedSingles.has(lemma))continue;newWords.push({...entry,lemma,surface:entry.word||surface,meaning:entry.vi||'Chưa có nghĩa'})}
 const normalizedPage=canonicalize(pageText);
 for(const saved of savedPhrases.sort((a,b)=>b.word.length-a.word.length)){const phrase=canonicalize(saved.word);if(!savedIdsOnPage.has(saved.id)&&!known.has(phrase)&&phraseOnPage(phrase,tokens,normalizedPage)){savedIdsOnPage.add(saved.id);savedOnPage.push({lemma:phrase,word:saved.word,meaning:saved.meaning,source:saved})}}
 return {newWords,savedOnPage}
}
