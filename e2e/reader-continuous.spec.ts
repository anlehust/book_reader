import {expect,test} from '@playwright/test';
import {resetLibrary,seedBook,testBookId} from './helpers';

let bookId='';

async function openReader(page:import('@playwright/test').Page){
 await page.goto(`/read/${bookId}`);
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000})
}

test.beforeEach(async({page},testInfo)=>{
 await resetLibrary(page.request);
 bookId=testBookId(testInfo.project.name,testInfo.title);
 await seedBook(page.request,bookId,'Desktop E2E Reader')
});

test.afterEach(async({page})=>{
 await page.goto('about:blank');
 await resetLibrary(page.request)
});

test('renders PDF and keeps continuous page tracking tied to visible area',async({page})=>{
 await openReader(page);
 await expect(page.locator('.reader-page-label')).toContainText('Trang 1/');
 await page.getByText('Liên tục',{exact:true}).click();
 await expect(page.locator('.pdf-page')).not.toHaveCount(0);
 await page.locator('.viewer').evaluate(viewer=>viewer.scrollTop+=Math.max(1,viewer.clientHeight*.75));
 await expect.poll(async()=>{
  const visible=await page.locator('.viewer').evaluate(viewer=>{const root=viewer.getBoundingClientRect();return [...viewer.querySelectorAll<HTMLElement>('[data-page]')].map(element=>{const rect=element.getBoundingClientRect();const width=Math.max(0,Math.min(rect.right,root.right)-Math.max(rect.left,root.left));const height=Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top));return {page:Number(element.dataset.page),area:width*height}}).sort((a,b)=>b.area-a.area)[0]?.page});
  const label=await page.locator('.reader-page-label').innerText();
  return label.includes(`Trang ${visible}/`)
 }).toBe(true)
});

test('restores the persisted page when reopening in continuous mode',async({page})=>{
 await openReader(page);
 await page.getByText('Liên tục',{exact:true}).click();
 const input=page.locator('.page-navigation input');
 await input.fill('10');
 await input.press('Enter');
 await expect(page.locator('.reader-page-label')).toContainText('Trang 10/');
 await expect.poll(()=>page.locator('.viewer').evaluate(viewer=>{const root=viewer.getBoundingClientRect(),target=viewer.querySelector<HTMLElement>('[data-page="10"]');if(!target)return false;const rect=target.getBoundingClientRect();return rect.bottom>root.top&&rect.top<root.bottom})).toBe(true);
 await expect.poll(async()=>{const response=await page.request.get(`/api/books/${bookId}`);return (await response.json() as {currentPage:number}).currentPage},{timeout:10_000}).toBe(10);
 await page.reload();
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000});
 await expect(page.locator('.reader-page-label')).toContainText('Trang 10/',{timeout:30_000});
 await expect.poll(()=>page.locator('.viewer').evaluate(viewer=>{const root=viewer.getBoundingClientRect();return [...viewer.querySelectorAll<HTMLElement>('[data-page]')].map(element=>{const rect=element.getBoundingClientRect();const width=Math.max(0,Math.min(rect.right,root.right)-Math.max(rect.left,root.left));const height=Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top));return {page:Number(element.dataset.page),area:width*height}}).sort((a,b)=>b.area-a.area)[0]?.page})).toBe(10)
});
