# Session Changelog — AI Lazy Reader Feature

## Tổng quan

Trong session này, đã thiết kế và implement tính năng **AI Lazy Reader** — hệ thống gợi ý từ vựng tự động khi đọc sách PDF tiếng Anh. Ngoài ra đã fix nhiều lỗi tiềm ẩn ảnh hưởng đến trải nghiệm người dùng.

---

## Tasks đã thực hiện

### Task 1: Thiết kế UI cho AI Lazy Reader

**Yêu cầu:** Thiết kế giao diện panel bên phải tích hợp cả phần "Gợi ý từ" (tự động) và "Từ đã lưu" (thủ công) trong cùng 1 panel.

**Quyết định thiết kế:**
- Panel phải chia thành 2 section: Gợi ý (trên) + Từ đã lưu (dưới)
- Có drag handle để resize tỉ lệ giữa 2 section
- Mỗi từ gợi ý có 2 nút: [+] lưu, [✕] đã biết
- Từ đã lưu xuất hiện trên trang hiện tại → hiện 🟢 dot trong phần gợi ý
- Toggle switch bật/tắt AI (tắt = không gọi hàm, không render)
- Cả 2 section đều collapse được
- Phần input "Từ mới / Nghĩa / + Thêm" cố định ở dưới cùng

**Mockup final:**

```
┌──────────────────────────────────────┬─────────────────────────────────────┐
│                                      │  🤖 Gợi ý            [●━━]    [▼] │
│                                      │─────────────────────────────────────│
│                                      │  proprietary │ sở hữu riêng [+][✕]│
│                                      │  concurrent  │ đồng thời    [+][✕]│
│                                      │  leverage    │ tận dụng     [+][✕]│
│           PDF VIEWER                 │ 🟢 deploy    │ triển khai         │
│                                      │ 🟢 mitigate  │ giảm nhẹ          │
│                                      │                                    │
│                                      │  ═══════ drag handle ═══════════  │
│                                      │                                    │
│                                      │  📝 Từ đã lưu          [47] [▼]  │
│                                      │─────────────────────────────────────│
│                                      │  ubiquitous  │ khắp nơi           │
│                                      │  deploy      │ triển khai          │
│                                      │  ...                               │
│                                      │─────────────────────────────────────│
│                                      │  [Từ mới...]                       │
│                                      │  [Nghĩa...]                        │
│                                      │  [+ Thêm]                          │
├──────────────────────────────────────┼─────────────────────────────────────┤
│  [−][100%][+] [📄][☆][☰][📝][🧠]   │     ═══progress═══    ◀ 27/150 ▶  │
└──────────────────────────────────────┴─────────────────────────────────────┘
```

**File HTML mockup:** `mockup/ai-reader-states.html`

---

### Task 2: Database schema — bảng `knownWords`

**Yêu cầu:** Lưu danh sách từ "đã biết" để không gợi ý lại, global cho tất cả sách.

**Thay đổi:**
- `pdf-reader/src/db/types.ts` — thêm interface `KnownWord { id, lemma, createdAt }`
- `pdf-reader/src/db/database.ts` — thêm version 2, bảng `knownWords` với index `id, lemma, createdAt`

---

### Task 3: Settings store mở rộng

**Yêu cầu:** Thêm toggle AI suggestion và user CEFR level.

**Thay đổi:**
- `pdf-reader/src/stores/useSettingsStore.ts`:
  - Thêm `aiSuggestionEnabled: boolean` (mặc định `true`)
  - Thêm `userLevel: CEFRLevel` (mặc định `'B1'`)
  - Thêm export type `CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`

---

### Task 4: Lemmatizer offline

**Yêu cầu:** Xử lý biến thể từ (quá khứ, số nhiều, irregular verbs...) để match CEFR wordlist.

**Thay đổi:**
- `pdf-reader/src/services/lemmatizer.ts` — tạo mới:
  - `lemmatize(word)`: chuyển từ về dạng gốc
  - `tokenize(text)`: tách text thành mảng từ
  - Bao gồm: ~100 irregular verbs, ~30 irregular plurals, irregular adjectives
  - Regular rules: -ing, -ed, -s/-es, -ies, -ly, comparative/superlative

---

### Task 5: CEFR Dataset đầy đủ (4816 từ)

**Yêu cầu:** Dùng Oxford 3000 + Oxford 5000, dịch nghĩa tiếng Việt, chỉ gợi ý từ B2 trở lên.

**Thay đổi:**
- Ban đầu inline trong `cefrData.ts` (~5000 dòng)
- Sau đó tách thành JSON files cho performance:
  - `pdf-reader/public/data/cefr-a1.json` — 687 từ
  - `pdf-reader/public/data/cefr-a2.json` — 860 từ
  - `pdf-reader/public/data/cefr-b1.json` — 767 từ
  - `pdf-reader/public/data/cefr-b2.json` — 1,236 từ
  - `pdf-reader/public/data/cefr-c1.json` — 1,266 từ
- `pdf-reader/src/services/cefrData.ts` — thin service, lazy-load:
  - `loadCEFRData(userLevel)`: fetch chỉ levels > userLevel
  - `getCEFREntry(lemma)`: lookup sync từ cache
  - `isAboveLevel()`: so sánh level
  - Cache trong memory, không re-fetch

---

### Task 6: Suggestion Engine

**Yêu cầu:** Phân tích text trang, lọc từ khó, detect cả cụm từ đã lưu.

**Thay đổi:**
- `pdf-reader/src/services/suggestionEngine.ts`:
  - Input: pageText, userLevel, savedLemmas, knownLemmas
  - Flow: tokenize → lemmatize → CEFR lookup → filter level → filter known → split new/saved
  - Detect cụm từ: dùng `pageText.includes(phrase)` cho multi-word
  - Output: `{ newWords, savedOnPage }`

---

### Task 7: Known Words Store

**Yêu cầu:** Quản lý danh sách "từ đã biết" — global, dùng chung tất cả sách.

**Thay đổi:**
- `pdf-reader/src/stores/useKnownWordsStore.ts`:
  - `knownWords: Set<string>` (lemma)
  - `loadKnownWords()`, `addKnownWord(lemma)`, `removeKnownWord(lemma)`, `isKnown(lemma)`
  - Persist trong IndexedDB bảng `knownWords`

---

### Task 8: Extract Page Text (+ fix memory leak)

**Yêu cầu:** Lấy text từ trang PDF hiện tại để AI phân tích.

**Thay đổi:**
- `pdf-reader/src/services/extractPageText.ts`:
  - Cache `PDFDocumentProxy` — chỉ parse PDF 1 lần, reuse cho mọi trang
  - `page.cleanup()` sau mỗi lần extract
  - `releaseCachedDocument()` khi đóng sách
  - Fix **critical bug**: trước đó mỗi lần lật trang tạo mới toàn bộ document → out of memory sau vài chục trang

---

### Task 9: AI Suggestion Panel (component)

**Yêu cầu:** UI hiển thị từ gợi ý tự động.

**Thay đổi:**
- `pdf-reader/src/components/reader/AISuggestionPanel.tsx`:
  - Header: "🤖 Gợi ý" + badge count + Switch (bật/tắt) + Collapse button
  - Content: list từ mới (có nút +/✕) + list từ đã lưu trên trang (🟢 dot)
  - `SuggestionRow` component:
    - Nút [+] → lưu vào vocab
    - Nút [✕] đỏ: single click = Popconfirm, double click = instant mark known
  - Load CEFR data khi mount/level thay đổi
  - Chỉ chạy analysis SAU khi data loaded
  - Enrich saved words meaning từ vocabWords store
  - Native `title` tooltip cho ellipsis text + cursor: text

---

### Task 10: VocabPanel refactor

**Yêu cầu:** Tích hợp AI panel + từ đã lưu trong 1 panel, có drag resize.

**Thay đổi:**
- `pdf-reader/src/components/reader/VocabPanel.tsx`:
  - Layout: AISuggestionPanel (resizable height) → drag handle → Vocab section → Quick add (fixed bottom)
  - Drag handle: kéo xuống = phóng to gợi ý, kéo lên = thu nhỏ
  - Khi collapse "Từ đã lưu": phần gợi ý tự mở rộng (`flex: 1`)
  - Drag handle ẩn khi vocab collapsed
  - Max height = container - 176px (chừa header + quick add)
  - Nút "Đã biết" trong expanded row → chuyển từ sang knownWords

---

### Task 11: Known Words Panel + Footer button

**Yêu cầu:** Cho phép xem/search/rollback từ đã biết.

**Thay đổi:**
- `pdf-reader/src/components/reader/KnownWordsPanel.tsx`:
  - Header "🧠 Từ đã biết" + badge
  - Search input
  - List sorted + nút ↩ undo (removeKnownWord)
- `pdf-reader/src/components/reader/ReaderPage.tsx`:
  - Thêm nút 🧠 ở footer (cạnh 📝 ☰ ☆)
  - Click → Popover chứa KnownWordsPanel

---

### Task 12: Fix selection popup bug

**Yêu cầu:** Bôi đen text trong input "Nghĩa" của popup → popup cũ biến mất, popup mới hiện ra.

**Thay đổi:**
- `pdf-reader/src/components/reader/useTextSelection.ts`:
  - Thêm check `selection.anchorNode` — nếu nằm trong `[data-selection-popup]` hoặc `input`/`textarea` → ignore, không trigger popup mới

---

### Task 13: Performance optimization — split JSON

**Yêu cầu:** Giảm lag bằng cách lazy-load CEFR data.

**Thay đổi:**
- Tách inline data → 5 JSON files (xem Task 5)
- `cefrData.ts` giờ chỉ ~60 dòng
- Chỉ fetch level cần thiết (B1 user → load B2 + C1 = ~2500 từ thay vì 4816)
- Main bundle nhẹ hơn đáng kể

---

### Task 14: Bug fixes tổng hợp

| Bug | File | Fix |
|-----|------|-----|
| Out of memory khi lật trang | `extractPageText.ts` | Cache PDF document, chỉ parse 1 lần |
| Thư viện giữ tất cả PDF binary trong RAM | `useBookStore.ts` | Strip `fileData` khỏi in-memory list |
| Toggle AI không phản ứng ngay | `ReaderPage.tsx` | Dùng reactive selector thay vì `getState()` |
| Upload file PDF hỏng → crash im lặng | `UploadZone.tsx` | try/catch + `message.error` + `pdf.destroy()` |
| Dịch thuật fail với đoạn dài | `translate.ts` | Truncate max 480 ký tự |
| NaN% progress khi totalPages=0 | `BookCard.tsx`, `ReaderPage.tsx` | Guard `totalPages > 0` |

---

## File mới được tạo

| File | Mô tả |
|------|--------|
| `docs/AI_LAZY_READER_SPEC.md` | Tài liệu spec chi tiết |
| `pdf-reader/src/services/lemmatizer.ts` | Lemmatizer offline |
| `pdf-reader/src/services/cefrData.ts` | CEFR service (lazy-load) |
| `pdf-reader/src/services/suggestionEngine.ts` | Engine phân tích trang |
| `pdf-reader/src/services/extractPageText.ts` | Extract text từ PDF (cached) |
| `pdf-reader/src/stores/useKnownWordsStore.ts` | Store từ đã biết |
| `pdf-reader/src/components/reader/AISuggestionPanel.tsx` | Panel gợi ý |
| `pdf-reader/src/components/reader/KnownWordsPanel.tsx` | Panel quản lý từ đã biết |
| `pdf-reader/public/data/cefr-a1.json` | Dataset A1 (687 từ) |
| `pdf-reader/public/data/cefr-a2.json` | Dataset A2 (860 từ) |
| `pdf-reader/public/data/cefr-b1.json` | Dataset B1 (767 từ) |
| `pdf-reader/public/data/cefr-b2.json` | Dataset B2 (1236 từ) |
| `pdf-reader/public/data/cefr-c1.json` | Dataset C1 (1266 từ) |

## File được sửa

| File | Thay đổi |
|------|----------|
| `pdf-reader/src/db/types.ts` | Thêm `KnownWord` interface |
| `pdf-reader/src/db/database.ts` | Thêm bảng `knownWords` (version 2) |
| `pdf-reader/src/stores/useSettingsStore.ts` | Thêm `aiSuggestionEnabled`, `userLevel` |
| `pdf-reader/src/stores/useBookStore.ts` | Strip fileData khỏi memory + fix regex |
| `pdf-reader/src/services/translate.ts` | Thêm max length guard |
| `pdf-reader/src/components/reader/VocabPanel.tsx` | Tích hợp AI panel + drag resize + "Đã biết" button |
| `pdf-reader/src/components/reader/ReaderPage.tsx` | Extract text + KnownWordsPanel + reactive toggle + progress guard |
| `pdf-reader/src/components/reader/useTextSelection.ts` | Fix selection inside popup |
| `pdf-reader/src/components/library/BookCard.tsx` | Progress guard |
| `pdf-reader/src/components/library/UploadZone.tsx` | Error handling + pdf.destroy() |

---

## Trạng thái UI — mô tả file HTML mockup

Xem file `mockup/ai-reader-states.html` cho visual mockup của các trạng thái:

1. **state-default** — AI bật, có từ gợi ý + từ đã lưu, mọi thứ mở
2. **state-collapsed-vocab** — Từ đã lưu collapsed, gợi ý chiếm full space
3. **state-ai-off** — AI tắt, chỉ còn phần Từ đã lưu + input
4. **state-known-words-popover** — Popover "Từ đã biết" mở từ footer
5. **state-suggestion-actions** — Hiển thị Popconfirm khi click ✕