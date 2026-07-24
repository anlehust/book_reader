import type {CEFRLevel} from '../db/types';

export interface CEFREntry {word:string;level:CEFRLevel;pos:string;vi:string}
type RawEntry={pos:string;vi:string};

const LEVEL_ORDER:CEFRLevel[]=['A1','A2','B1','B2','C1'];
const paths:Record<CEFRLevel,string>={A1:'/data/cefr-a1.json',A2:'/data/cefr-a2.json',B1:'/data/cefr-b1.json',B2:'/data/cefr-b2.json',C1:'/data/cefr-c1.json'};
const entries=new Map<string,CEFREntry>();
const loaded=new Set<CEFRLevel>();
const pending=new Map<CEFRLevel,Promise<void>>();

export function isAboveLevel(level:CEFRLevel,userLevel:CEFRLevel){return LEVEL_ORDER.indexOf(level)>LEVEL_ORDER.indexOf(userLevel)}

const validate=(value:unknown,level:CEFRLevel)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`Dữ liệu CEFR ${level} không hợp lệ`);
 const parsed:CEFREntry[]=[];
 for(const [word,raw] of Object.entries(value)){
  if(!word.trim()||!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`Entry CEFR ${level} không hợp lệ`);
  const item=raw as Partial<RawEntry>;
  if(typeof item.pos!=='string'||!item.pos.trim()||typeof item.vi!=='string')throw new Error(`Entry CEFR ${level}:${word} không hợp lệ`);
  parsed.push({word,level,pos:item.pos.trim(),vi:item.vi.trim()})
 }
 return parsed
};

async function loadLevel(level:CEFRLevel){
 if(loaded.has(level))return;
 const existing=pending.get(level);if(existing)return existing;
 const promise=(async()=>{const response=await fetch(paths[level]);if(!response.ok)throw new Error(`Không tải được dữ liệu CEFR ${level}`);for(const entry of validate(await response.json(),level))entries.set(entry.word,entry);loaded.add(level)})();
 pending.set(level,promise);
 try{await promise}finally{pending.delete(level)}
}

export async function loadCEFRData(userLevel:CEFRLevel='B1'){await Promise.all(LEVEL_ORDER.filter(level=>isAboveLevel(level,userLevel)).map(loadLevel))}
export function getCEFREntry(lemma:string){return entries.get(lemma)}
export function seedCEFRDataForTests(values:CEFREntry[]){for(const entry of values)entries.set(entry.word,entry)}
export function resetCEFRDataForTests(){entries.clear();loaded.clear();pending.clear()}
