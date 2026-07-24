# ReadFlow - PDF Reader App



## Tổng quan



Ứng dụng web đọc sách PDF offline-first với bookmark, highlight, ghi chú từ mới, dịch tự động, và lưu tiến trình đọc. Không cần server, không cần đăng nhập — mọi dữ liệu lưu trong trình duyệt (IndexedDB).



---



## Cách chạy trên máy mới



```bash

# 1. Clone/copy project

cd pdf-reader



# 2. Cài dependencies

npm install



# 3. Chạy dev server

npm run dev



# 4. Mở trình duyệt tại http://localhost:5173

```



---



## Tech Stack



| Layer | Công nghệ |

|-------|-----------|

| Framework | React 19 + TypeScript |

| Build tool | Vite 8 |

| UI Library | Ant Design 6 (dark theme) |

| Styling | Tailwind CSS 4 + CSS Variables |

| PDF Rendering | react-pdf 10 (pdf.js) |

| State Management | Zustand 5 |

| Persistence | Dexie.js 4 (IndexedDB wrapper) |

| Routing | React Router 7 |

| Translation | MyMemory API (free, no key) |



---



## Tính năng



### 1. Thư viện sách (Library Page)

- Upload PDF bằng click hoặc drag & drop

- Hiển thị sách dạng grid card với cover gradient, progress %, badge trạng thái

- Tìm kiếm theo tên sách

- Sắp xếp: gần đây / tên A-Z / ngày thêm

- Thống kê: số sách, đang đọc, từ mới, bookmark

- Xoá sách (2 bước xác nhận)

- Empty state đẹp khi thư viện trống



### 2. Đọc PDF (Reader Page)

- Render PDF trong trình duyệt

- 2 chế độ đọc (người dùng chọn, lưu nhớ):

  - **Từng trang (Paginated)**: cuộn chuột chuyển trang, animation trượt

  - **Cuộn liên tục (Continuous)**: scroll mượt, lazy render ±2 trang, IntersectionObserver tính trang hiện tại theo % hiển thị lớn nhất

- Zoom in/out (50% → 250%)

- Nhảy trang bằng ô nhập số

- Keyboard shortcuts: ← → chuyển trang, B bookmark

- Tự động lưu trang cuối đọc (debounce 800ms)

- Resume: mở lại sách nhảy đúng vị trí



### 3. Bookmark

- Đánh dấu trang hiện tại

- Xem danh sách bookmark ở sidebar (sắp xếp theo trang)

- Click bookmark nhảy đến trang đó

- Xoá bookmark



### 4. Highlight

- Bôi chọn text → popup hiện 4 màu (vàng, xanh, hồng, cam)

- Click màu → lưu highlight

- Xem danh sách highlight ở sidebar (có màu viền tương ứng)

- Click highlight nhảy đến trang

- Xoá highlight



### 5. Từ mới (Vocabulary Panel)

- Bôi chọn text → "📝 Từ mới" → tự dịch bằng MyMemory API

- Từ tự động chuyển về lowercase

- Cho phép sửa từ trước khi lưu

- Ô ví dụ (tuỳ chọn)

- Warning nếu từ đã có trong danh sách (trùng hoặc chứa)

- Panel bên phải, resize được (kéo cạnh trái, 200-500px)

- Hiển thị dạng Table compact + zebra striping

- Click row → expand hiện full từ/nghĩa + nút Sửa/Xoá

- Click ra ngoài → tự collapse

- Edit inline cả từ gốc + nghĩa

- Filter "chỉ trang này"

- Quick add ở bottom panel

- Timeout dịch 5s, nếu fail → user tự nhập



### 6. Sidebar trái

- Tabs: Bookmark | Highlight (Antd Tabs)

- Mỗi item là Card compact, click nhảy trang

- Nút bookmark/unbookmark trang hiện tại

- Badge đếm số lượng



### 7. Offline & Persistence

- PDF lưu dưới dạng ArrayBuffer trong IndexedDB

- Bookmark, highlight, từ mới đều persist

- Reading mode preference lưu localStorage

- Hoạt động hoàn toàn offline sau upload



---



## Kiến trúc Project



```

pdf-reader/src/

├── main.tsx                    # Entry point

├── App.tsx                     # Router + Antd ConfigProvider (dark theme)

├── index.css                   # Tailwind + CSS vars + custom overrides

│

├── db/

│   ├── database.ts             # Dexie DB schema (ReadFlowDB)

│   └── types.ts                # Book, Bookmark, Highlight, VocabWord interfaces

│

├── stores/

│   ├── useBookStore.ts         # CRUD sách, reading position

│   ├── useBookmarkStore.ts     # CRUD bookmark

│   ├── useHighlightStore.ts    # CRUD highlight

│   ├── useVocabStore.ts        # CRUD từ mới (word, meaning, example)

│   └── useSettingsStore.ts     # Reading mode preference (persist localStorage)

│

├── services/

│   └── translate.ts            # Translation wrapper (MyMemory API, 5s timeout)

│

├── components/

│   ├── library/

│   │   ├── LibraryPage.tsx     # Trang chủ thư viện

│   │   ├── BookCard.tsx        # Card sách (Antd Card + Progress)

│   │   └── UploadZone.tsx      # Upload PDF (Antd Dragger)

│   │

│   └── reader/

│       ├── ReaderPage.tsx      # Layout đọc sách (header + main + footer)

│       ├── PaginatedViewer.tsx # Chế độ từng trang (scroll wheel navigate)

│       ├── ContinuousViewer.tsx# Chế độ cuộn liên tục (IntersectionObserver)

│       ├── Sidebar.tsx         # Sidebar bookmark/highlight (Antd Tabs + Card)

│       ├── VocabPanel.tsx      # Panel từ mới (Antd Table expandable + zebra)

│       ├── SelectionPopup.tsx  # Popup bôi chọn text (highlight/vocab/warning)

│       ├── ResizablePanel.tsx  # Wrapper cho phép kéo resize panel

│       └── useTextSelection.ts # Hook xử lý text selection

```



---



## Data Model (IndexedDB)



```typescript

interface Book {

  id: string;

  title: string;

  fileName: string;

  fileData: ArrayBuffer;  // PDF binary, persist vĩnh viễn

  totalPages: number;

  currentPage: number;

  addedAt: number;

  lastReadAt: number;

}



interface Bookmark {

  id: string;

  bookId: string;

  page: number;

  note?: string;

  createdAt: number;

}



interface Highlight {

  id: string;

  bookId: string;

  page: number;

  text: string;

  color: 'yellow' | 'green' | 'pink' | 'orange';

  note?: string;

  createdAt: number;

}



interface VocabWord {

  id: string;

  bookId: string;

  word: string;

  meaning: string;

  example?: string;

  page: number;

  createdAt: number;

}

```



---



## Color Palette (Dark Theme)



```css

--bg-primary: #141422;      /* Nền chính */

--bg-secondary: #1c1c32;   /* Card, panel, header */

--bg-tertiary: #2a2a45;    /* Zebra row, hover */

--bg-viewer: #1e1e30;      /* PDF viewer background */

--accent: #6cb4ee;          /* Primary accent (soft blue) */

--accent-hover: #4a9de0;   /* Accent hover state */

--text-primary: #e8e8f0;   /* Text chính */

--text-secondary: #a0a0b8; /* Text phụ */

--text-muted: #6b6b85;     /* Text mờ */

--border: #2e2e48;          /* Viền */

```



---



## Translation Service



File: `src/services/translate.ts`



- API: MyMemory Translation API (`api.mymemory.translated.net`)

- Free tier: 5000 chars/ngày (không cần key)

- Timeout: 5 giây

- Fallback: trả empty → user tự nhập

- Wrapper function `translateText(text, from, to)` — đổi provider chỉ sửa file này



---



## Routing



| Path | Component | Mô tả |

|------|-----------|--------|

| `/` | LibraryPage | Thư viện sách |

| `/read/:bookId` | ReaderPage | Đọc sách |



---



## Lưu ý khi deploy/build



```bash

npm run build    # Output: dist/

npm run preview  # Preview production build

```



- Static files, host ở Vercel/Netlify/GitHub Pages miễn phí

- Không cần backend

- pdf.js worker file được Vite bundle tự động

- Antd tree-shaking tự động (chỉ bundle component đang dùng)



---



## Các quyết định thiết kế quan trọng



1. **ArrayBuffer thay vì File/Blob** cho lưu PDF — đảm bảo persist sau restart trình duyệt

2. **IntersectionObserver** cho continuous scroll — off-main-thread, không lag

3. **Zustand** thay Context API — performance tốt hơn với state phức tạp

4. **Dexie.js** thay raw IndexedDB — API đơn giản, typed, reactive

5. **ResizablePanel** tự build — nhẹ, không thêm dependency

6. **Translation wrapper pattern** — đổi provider (Lingva/Google/offline dict) chỉ sửa 1 file

7. **expandRowByClick** cho vocab table — compact nhất, từ ngắn thấy ngay, từ dài click expand

8. **Zebra striping** — phân tách row không tốn pixel

9. **2 chế độ đọc** — paginated cho đọc chú thích, continuous cho đọc liên tục

10. **Auto-lowercase** từ mới + cho phép sửa trước khi lưu