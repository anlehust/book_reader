import {afterEach,describe,expect,it,vi} from 'vitest';
import {getCEFREntry,isAboveLevel,loadCEFRData,resetCEFRDataForTests} from './cefrData';

describe('CEFR data',()=>{
 afterEach(()=>{vi.restoreAllMocks();resetCEFRDataForTests()});
 it('compares levels strictly',()=>{expect(isAboveLevel('B2','B1')).toBe(true);expect(isAboveLevel('B1','B1')).toBe(false);expect(isAboveLevel('A2','B1')).toBe(false)});
 it('loads only B2/C1 once for fixed B1',async()=>{const fetcher=vi.spyOn(globalThis,'fetch').mockImplementation(async url=>new Response(JSON.stringify(String(url).includes('b2')?{proprietary:{pos:'adj',vi:''}}:{concurrent:{pos:'adj',vi:''}})));await Promise.all([loadCEFRData('B1'),loadCEFRData('B1')]);expect(fetcher).toHaveBeenCalledTimes(2);expect(getCEFREntry('proprietary')).toMatchObject({level:'B2',vi:''});expect(getCEFREntry('concurrent')).toMatchObject({level:'C1'})});
 it('rejects malformed entries',async()=>{vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(JSON.stringify({bad:{vi:''}})));await expect(loadCEFRData('B1')).rejects.toThrow('không hợp lệ')});
});
