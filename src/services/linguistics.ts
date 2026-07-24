const irregular:Record<string,string>={
 am:'be',are:'be',is:'be',was:'be',were:'be',been:'be',being:'be',
 became:'become',began:'begin',begun:'begin',bought:'buy',brought:'bring',built:'build',came:'come',caught:'catch',chose:'choose',chosen:'choose',did:'do',done:'do',drank:'drink',drunk:'drink',drove:'drive',driven:'drive',ate:'eat',eaten:'eat',fell:'fall',fallen:'fall',felt:'feel',found:'find',flew:'fly',flown:'fly',forgot:'forget',forgotten:'forget',gave:'give',given:'give',got:'get',gotten:'get',grew:'grow',grown:'grow',had:'have',heard:'hear',held:'hold',kept:'keep',knew:'know',known:'know',left:'leave',lost:'lose',made:'make',met:'meet',paid:'pay',ran:'run',read:'read',rode:'ride',ridden:'ride',said:'say',saw:'see',seen:'see',sent:'send',sat:'sit',slept:'sleep',sold:'sell',spoke:'speak',spoken:'speak',stood:'stand',swam:'swim',swum:'swim',taught:'teach',told:'tell',thought:'think',took:'take',taken:'take',understood:'understand',wore:'wear',worn:'wear',went:'go',gone:'go',won:'win',wrote:'write',written:'write',
 children:'child',feet:'foot',geese:'goose',men:'man',mice:'mouse',people:'person',teeth:'tooth',women:'woman',knives:'knife',wives:'wife',lives:'life',leaves:'leaf',shelves:'shelf',halves:'half',loaves:'loaf',thieves:'thief',calves:'calf',scarves:'scarf',wolves:'wolf',
 better:'good',best:'good',worse:'bad',worst:'bad',farther:'far',farthest:'far',further:'far',furthest:'far',
};
const invariant=new Set(['news','series','species','means','sheep','deer','fish','aircraft','physics','economics','mathematics']);

export interface Token {surface:string;normalized:string;lemma:string}

export function canonicalize(value:string){return value.normalize('NFKC').replace(/[’‘]/g,"'").trim().toLowerCase().replace(/\s+/g,' ')}

export function tokenize(text:string){
 const matches=text.normalize('NFKC').match(/[\p{L}]+(?:['’-][\p{L}]+)*/gu)||[];
 return matches.map(surface=>{const normalized=canonicalize(surface);return {surface,normalized,lemma:lemmatize(normalized)}})
}

export function lemmatize(input:string){
 const candidates=lemmaCandidates(input);
 return candidates[0]??canonicalize(input)
}

export function lemmaCandidates(input:string){
 const word=canonicalize(input);
 if(!word||word.includes(' '))return [word].filter(Boolean);
 const candidates:string[]=[];
 const add=(candidate:string)=>{if(candidate&&!candidates.includes(candidate))candidates.push(candidate)};
 if(invariant.has(word))return [word];
 if(irregular[word])add(irregular[word]);
 if(word.length>4&&word.endsWith('ies'))add(`${word.slice(0,-3)}y`);
 if(word.length>4&&word.endsWith('ied'))add(`${word.slice(0,-3)}y`);
 if(word.length>4&&word.endsWith('ves')){const stem=word.slice(0,-3);add(`${stem}f`);add(`${stem}fe`)}
 if(word.length>4&&word.endsWith('oes'))add(word.slice(0,-2));
 if(word.length>6&&word.endsWith('ing')){
  const stem=word.slice(0,-3);
  if(/([b-df-hj-np-tv-z])\1$/.test(stem))add(stem.slice(0,-1));
  if(stem.endsWith('at')||stem.endsWith('iz')||stem.endsWith('it'))add(`${stem}e`);
  add(`${stem}e`);
  add(stem);
 }
 if(word.length>5&&word.endsWith('ed')){
  let stem=word.slice(0,-2);
  if(/([b-df-hj-np-tv-z])\1$/.test(stem))stem=stem.slice(0,-1);
  if(stem.endsWith('at')||stem.endsWith('iz')||stem.endsWith('it'))add(`${stem}e`);
  add(`${stem}e`);
  add(stem);
 }
 if(word.length>5&&word.endsWith('est'))add(word.slice(0,-3));
 if(word.length>4&&word.endsWith('er'))add(word.slice(0,-2));
 if(word.length>4&&/(ches|shes|sses|xes|zes)$/.test(word))add(word.slice(0,-2));
 if(word.length>3&&word.endsWith('s')&&!word.endsWith('ss')&&!word.endsWith('us')&&!word.endsWith('is'))add(word.slice(0,-1));
 add(word);
 return candidates
}
