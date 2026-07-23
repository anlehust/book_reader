import {test,expect} from '@playwright/test';
import path from 'node:path';

const pdfPath=path.resolve('SMCB09.pdf');

test('renders PDF and keeps continuous page tracking tied to visible area',async({page})=>{
 await page.goto('/');
 await page.locator('input[type="file"]').setInputFiles(pdfPath);
 await expect(page.getByRole('heading',{name:'SMCB09'})).toBeVisible({timeout:30_000});
 await page.getByRole('heading',{name:'SMCB09'}).click();
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000});
 await expect(page.locator('.reader-page-label')).toContainText('Trang 1/');
 const mode=page.getByText('Liên tục',{exact:true});
 await mode.click();
 await expect(page.locator('.pdf-page')).not.toHaveCount(0);
 const result=await page.locator('.viewer').evaluate(viewer=>{
  const root=viewer.getBoundingClientRect();
  const pages=[...viewer.querySelectorAll<HTMLElement>('[data-page]')];
  const visible=pages.map(element=>{const rect=element.getBoundingClientRect();const width=Math.max(0,Math.min(rect.right,root.right)-Math.max(rect.left,root.left));const height=Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top));return {page:Number(element.dataset.page),area:width*height}}).filter(item=>item.area>0).sort((a,b)=>b.area-a.area)[0];
  return {visible,scrollTop:viewer.scrollTop};
 });
 expect(result.visible?.page).toBe(1);
 await page.locator('.viewer').evaluate(viewer=>viewer.scrollTop+=Math.max(1,viewer.clientHeight*.35));
 await page.waitForTimeout(250);
 const after=await page.locator('.viewer').evaluate(viewer=>{
  const root=viewer.getBoundingClientRect();
  const pages=[...viewer.querySelectorAll<HTMLElement>('[data-page]')];
  return pages.map(element=>{const rect=element.getBoundingClientRect();const width=Math.max(0,Math.min(rect.right,root.right)-Math.max(rect.left,root.left));const height=Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top));return {page:Number(element.dataset.page),area:width*height}}).sort((a,b)=>b.area-a.area)[0];
 });
 const label=await page.locator('.reader-page-label').innerText();
 expect(label).toContain(`Trang ${after.page}/`);
});

test('restores the persisted page when reopening in continuous mode',async({page})=>{
 await page.goto('/');
 await page.locator('input[type="file"]').setInputFiles(pdfPath);
 const book=page.getByRole('heading',{name:'SMCB09'});
 await expect(book).toBeVisible({timeout:30_000});
 await book.click();
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000});
 await page.getByText('Liên tục',{exact:true}).click();
 const input=page.locator('.page-navigation input');
 await input.fill('10');
 await input.press('Enter');
 await expect(page.locator('.reader-page-label')).toContainText('Trang 10/');
 await expect.poll(()=>page.locator('.viewer').evaluate(viewer=>{const root=viewer.getBoundingClientRect(),target=viewer.querySelector<HTMLElement>('[data-page="10"]');if(!target)return false;const rect=target.getBoundingClientRect();return rect.bottom>root.top&&rect.top<root.bottom})).toBe(true);
 await page.waitForTimeout(1100);
 await page.locator('.reader-header .ant-btn').first().click();
 const reopened=page.locator('.library-section').filter({hasText:'Tất cả'}).getByRole('heading',{name:'SMCB09'});
 await expect(reopened).toBeVisible();
 await reopened.click();
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000});
 await expect(page.locator('.reader-page-label')).toContainText('Trang 10/',{timeout:30_000});
 await expect.poll(()=>page.locator('.viewer').evaluate(viewer=>{const root=viewer.getBoundingClientRect();return [...viewer.querySelectorAll<HTMLElement>('[data-page]')].map(element=>{const rect=element.getBoundingClientRect();const width=Math.max(0,Math.min(rect.right,root.right)-Math.max(rect.left,root.left));const height=Math.max(0,Math.min(rect.bottom,root.bottom)-Math.max(rect.top,root.top));return {page:Number(element.dataset.page),area:width*height}}).sort((a,b)=>b.area-a.area)[0]?.page})).toBe(10);
 await page.waitForTimeout(1000);
 await expect(page.locator('.reader-page-label')).toContainText('Trang 10/');
});

