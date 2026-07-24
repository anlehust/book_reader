import {describe,expect,it,vi} from 'vitest';
import {extractPageText,releasePageTextCache} from './extractPageText';

describe('extractPageText',()=>{
 it('reuses cached text and cleans page resources',async()=>{const cleanup=vi.fn(),getPage=vi.fn().mockResolvedValue({getTextContent:vi.fn().mockResolvedValue({items:[{str:'Hello'},{str:'world'}]}),cleanup});const document={getPage} as never;await expect(extractPageText(document,1)).resolves.toBe('Hello world');await expect(extractPageText(document,1)).resolves.toBe('Hello world');expect(getPage).toHaveBeenCalledTimes(1);expect(cleanup).toHaveBeenCalledTimes(1);releasePageTextCache(document);await extractPageText(document,1);expect(getPage).toHaveBeenCalledTimes(2)});
 it('cleans resources when extraction fails',async()=>{const cleanup=vi.fn(),document={getPage:vi.fn().mockResolvedValue({getTextContent:vi.fn().mockRejectedValue(new Error('broken')),cleanup})} as never;await expect(extractPageText(document,1)).rejects.toThrow('broken');expect(cleanup).toHaveBeenCalledOnce()});
});
