import {expect,test} from '@playwright/test';
import {PDF_PAGE_COUNT,resetLibrary,seedBook,testBookId} from './helpers';

let bookId='';

async function openReader(page:import('@playwright/test').Page){
 await page.goto(`/read/${bookId}`);
 await expect(page.locator('.react-pdf__Page canvas').first()).toBeVisible({timeout:30_000})
}

test.beforeEach(async({page},testInfo)=>{
 await resetLibrary(page.request);
 bookId=testBookId(testInfo.project.name,testInfo.title);
 await seedBook(page.request,bookId)
});

test.afterEach(async({page})=>{
 await page.goto('about:blank');
 await resetLibrary(page.request)
});

test('phone portrait supports page controls, zoom, bookmark, panels, vocabulary and continuous navigation',async({page})=>{
 await openReader(page);
 const toolbar=page.locator('.phone-reader-toolbar');
 await expect(toolbar).toBeVisible();
 await expect(toolbar.getByText('Trang',{exact:true})).toBeVisible();
 await expect(toolbar.getByText('Cuộn',{exact:true})).toBeVisible();
 const firstWidth=await page.locator('.react-pdf__Page canvas').first().evaluate(canvas=>canvas.getBoundingClientRect().width);
 await page.getByRole('button',{name:'Phóng to'}).click();
 await expect.poll(()=>page.locator('.react-pdf__Page canvas').first().evaluate(canvas=>canvas.getBoundingClientRect().width)).toBeGreaterThan(firstWidth);
 await page.getByRole('button',{name:'Bookmark trang hiện tại'}).click();
 await expect(page.getByRole('button',{name:'Bookmark trang hiện tại'})).toHaveAttribute('aria-pressed','true');
 await expect.poll(async()=>{const response=await page.request.get(`/api/books/${bookId}/bookmarks`);return (await response.json() as unknown[]).length}).toBe(1);
 await toolbar.getByText('Cuộn',{exact:true}).click();
 await expect(page.locator('.mobile-continuous-viewer')).toBeVisible();
 await expect(page.locator('.mobile-pdf-page-slot')).toHaveCount(PDF_PAGE_COUNT);
 await page.locator('.page-navigation input').fill('10');
 await page.locator('.page-navigation input').press('Enter');
 await expect.poll(()=>page.locator('.mobile-continuous-viewer').evaluate(viewer=>{const target=viewer.querySelector<HTMLElement>('[data-page="10"]');const desired=target?Math.min(Math.max(0,target.offsetTop-12),Math.max(0,viewer.scrollHeight-viewer.clientHeight)):null;return desired!==null&&Math.abs(viewer.scrollTop-desired)<=20}),{timeout:30_000}).toBe(true);
 await expect.poll(async()=>Number(await page.locator('.page-navigation input').inputValue())).toBe(10);
 await expect.poll(()=>page.locator('.mobile-pdf-page-slot.rendered').count()).toBeLessThanOrEqual(5);
 await page.getByRole('button',{name:'Panels'}).click();
 const drawer=page.locator('.phone-reader-drawer');
 await expect(drawer).toBeVisible();
 await drawer.locator('.phone-panel-tabs').getByText(/^Từ mới \(0\)$/).click();
 await drawer.getByPlaceholder('Từ mới...').fill('responsive');
 await drawer.getByPlaceholder('Nghĩa...').fill('thích ứng');
 await drawer.getByRole('button',{name:'+ Thêm'}).click();
 await expect(drawer.getByText('responsive',{exact:true})).toBeVisible();
 await expect.poll(async()=>{const response=await page.request.get(`/api/books/${bookId}/vocabulary`);return (await response.json() as Array<{word:string}>)[0]?.word}).toBe('responsive')
});

test('phone panels manage existing highlights without selection creation',async({page})=>{
 const seeded=await page.request.post(`/api/books/${bookId}/highlights`,{data:{page:3,text:'Existing phone highlight',color:'yellow'}});
 expect(seeded.ok()).toBeTruthy();
 await openReader(page);
 await page.getByRole('button',{name:'Mở các panel'}).click();
 const drawer=page.locator('.phone-reader-drawer');
 await drawer.locator('.phone-panel-tabs').getByText(/^Highlight \(1\)$/).click();
 let item=drawer.locator('.sidebar-note').filter({hasText:'Existing phone highlight'});
 await expect(item).toBeVisible();
 await item.click();
 await expect.poll(async()=>Number(await page.locator('.page-navigation input').inputValue())).toBe(3);
 await page.getByRole('button',{name:'Mở các panel'}).click();
 await drawer.locator('.phone-panel-tabs').getByText(/^Highlight \(1\)$/).click();
 item=drawer.locator('.sidebar-note').filter({hasText:'Existing phone highlight'});
 await item.getByRole('button',{name:'Ghi chú'}).click();
 const dialog=page.getByRole('dialog');
 await dialog.locator('textarea').fill('Phone note');
 await dialog.getByRole('button',{name:'OK'}).click();
 await expect(item.getByText('Phone note')).toBeVisible();
 await item.locator('.note-actions button').last().click();
 await expect(drawer.getByText('Existing phone highlight')).toHaveCount(0);
 await expect.poll(async()=>{const response=await page.request.get(`/api/books/${bookId}/highlights`);return (await response.json() as unknown[]).length}).toBe(0);
 await expect(page.locator('.selection-pop')).toBeHidden()
});

test('phone landscape shows PDF and vocabulary side by side @landscape',async({page})=>{
 const seeded=await page.request.post(`/api/books/${bookId}/vocabulary`,{data:{page:1,word:'landscape',meaning:'ngang'}});
 expect(seeded.ok()).toBeTruthy();
 await openReader(page);
 const reader=page.locator('.reader'),vocab=page.locator('.reader > .vocab-panel');
 await expect(reader).toHaveClass(/phone-landscape/);
 await expect(page.locator('.viewer')).toBeVisible();
 await expect(vocab).toBeVisible();
 await expect(vocab).toHaveAttribute('aria-hidden','false');
 await expect(vocab.getByText('landscape',{exact:true})).toBeVisible();
 const geometry=await reader.evaluate(element=>{const viewer=element.querySelector<HTMLElement>(':scope > .viewer')!,vocabPanel=element.querySelector<HTMLElement>(':scope > .vocab-panel')!,root=element.getBoundingClientRect(),left=viewer.getBoundingClientRect(),right=vocabPanel.getBoundingClientRect();return {readerWidth:element.scrollWidth,viewportWidth:document.documentElement.clientWidth,root,left,right}});
 expect(geometry.readerWidth).toBeLessThanOrEqual(geometry.viewportWidth);
 expect(geometry.left.right).toBeLessThanOrEqual(geometry.right.left+1);
 expect(geometry.right.right).toBeLessThanOrEqual(geometry.root.right+1);
 await page.locator('.phone-reader-toolbar').getByText('Cuộn',{exact:true}).click();
 await expect(page.locator('.mobile-continuous-viewer')).toBeVisible();
 await expect(vocab).toBeVisible();
 await vocab.getByPlaceholder('Từ mới...').fill('parallel');
 await vocab.getByPlaceholder('Nghĩa...').fill('song song');
 await vocab.getByRole('button',{name:'+ Thêm'}).click();
 await expect(vocab.getByText('parallel',{exact:true})).toBeVisible()
});
