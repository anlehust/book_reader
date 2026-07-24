import {describe,expect,it} from 'vitest';
import {canonicalize,lemmatize,tokenize} from './linguistics';

describe('linguistics',()=>{
 it('normalizes casing, spacing and apostrophes',()=>expect(canonicalize('  Reader’s   FLOW ')).toBe("reader's flow"));
 it('tokenizes English words while preserving display text',()=>expect(tokenize("Readers’ long-term plans.").map(token=>token.normalized)).toEqual(['readers','long-term','plans']));
 it.each([['went','go'],['children','child'],['studies','study'],['running','run'],['planned','plan'],['boxes','box'],['better','good']])('lemmatizes %s', (word,lemma)=>expect(lemmatize(word)).toBe(lemma));
 it('keeps phrases canonical instead of applying single-word suffix rules',()=>expect(lemmatize('take into account')).toBe('take into account'));
});
