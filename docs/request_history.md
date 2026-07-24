# Tổng hợp yêu cầu — Session AI Lazy Reader

Danh sách tuần tự các yêu cầu từ user, tóm tắt request và cách thực hiện.

---

## 1. Đánh giá ý tưởng AI Lazy Reader

**Request:** Trình bày ý tưởng "AI Lazy Reader" — đọc sách tiếng Anh mà không cần tra từ. Hệ thống tự phân tích trang, gợi ý từ vượt trình độ, đánh giá độ khó, viết lại câu. Hỏi ý kiến.

**Cách làm:** Phân tích ưu/nhược, recommend chia 3 phase (CEFR filter → difficulty rating → AI Rewrite). Gợi ý kiến trúc offline-first, chỉ dùng LLM khi cần giải thích câu khó.

---

## 2. Xử lý biến thể từ (lemmatization)

**Request:** Hỏi có khó không để xử lý quá khứ, số nhiều, irregular verbs?

**Cách làm:** Recommend kết hợp lemmatizer (wink-lemmatizer hoặc compromise) + lookup table cho irregular forms (~300-500 entries). Cuối cùng implement tự build lemmatizer nhẹ (không dependency ngoài) với irregular verbs/nouns/adj table + regular rules.

---

## 3. Thiết kế UI panel — tích hợp từ mới + gợi ý

**Request:** Hỏi cách tối ưu hiển thị cả phần vocab panel hiện tại và chức năng mới. Yêu cầu vẽ mockup bằng ký tự (không HTML).

**Cách làm:** Đưa ra nhiều option (tabs, split vertical, inline compact, card). Iterate qua nhiều lần mockup dựa trên feedback. Kết quả: 2 section trong 1 panel — Gợi ý (trên) + Từ đã lưu (dưới).

---

## 4. Nút action cho từ gợi ý: [+] và [✓]

**Request:** Mỗi từ gợi ý cần 2 nút: [+] lưu vào vocab, [✓] đánh dấu đã biết.

**Cách làm:** Implement 2 nút ở mỗi row gợi ý. Từ đã lưu → hiện 🟢 dot, không có nút. Từ đã biết → vào knownWords, không gợi ý lại.

---

## 5. Bỏ phần AI Rewrite + đơn giản hóa hiển thị

**Request:** Không cần phần "viết lại câu". Hiển thị row đơn giản (2 cột: từ | nghĩa) giống vocab panel hiện tại.

**Cách làm:** Loại bỏ AI Rewrite khỏi spec. Giữ format table 2 cột cho tất cả sections.

---

## 6. Toggle ON/OFF bằng switch (không chữ, chỉ màu)

**Request:** Dùng switch để bật/tắt gợi ý. Không cần chữ ON/OFF, chỉ màu xanh/xám.

**Cách làm:** Dùng Antd `<Switch size="small">` — xanh lá khi bật, xám khi tắt. OFF = không gọi hàm, không fetch, không render.

---

## 7. Collapse cho cả 2 section

**Request:** Cho phép thu gọn cả phần "Gợi ý" và "Từ đã lưu".

**Cách làm:** Thêm nút [▼/▶] ở header mỗi section. Click = toggle collapse.

---

## 8. Hiển thị từ đã lưu xuất hiện trên trang

**Request:** Từ đã lưu mà đang có trên trang hiện tại → hiện trong phần gợi ý với 🟢 dot xanh lá, không cần section riêng.

**Cách làm:** Trong suggestion engine, sau khi filter CEFR, check thêm `savedLemmas` → split thành `newWords` (chưa lưu) và `savedOnPage` (đã lưu, có mặt trên trang). Hiển thị cùng list, từ chưa lưu ở trên, từ đã lưu (🟢) ở dưới.

---

## 9. Viết tài liệu + implement

**Request:** OK với mockup final, thực hiện viết spec và code.

**Cách làm:** 
- Tạo `docs/AI_LAZY_READER_SPEC.md`
- Implement toàn bộ: database, stores, services, components
- Build pass

---

## 10. Dataset CEFR đầy đủ

**Request:** Lấy dataset CEFR đầy đủ, dùng bản full Oxford 3000 + 5000. Nghĩa tiếng Việt tự dịch.

**Cách làm:** User cung cấp 2 file PDF (Oxford 3000, Oxford 5000). Extract toàn bộ từ, dịch nghĩa tiếng Việt. Kết quả: 4816 từ (A1:687, A2:860, B1:767, B2:1236, C1:1266).

---

## 11. Chỉ gợi ý từ B2 trở lên

**Request:** Sửa logic chỉ gợi ý từ level B2+.

**Cách làm:** Logic `isAboveLevel(entry.level, userLevel)` đã đúng — với `userLevel = 'B1'` (mặc định), chỉ hiện B2, C1. Không cần sửa gì.

---

## 12. Kéo resize phần "Từ đã lưu"

**Request:** Cho phép kéo lên/xuống để điều chỉnh kích thước. Kéo = thay đổi diện tích phần gợi ý phía trên (không phải tăng input bên dưới).

**Cách làm:** Thêm drag handle giữa 2 section. Kéo xuống = phóng to phần gợi ý (tăng height), kéo lên = thu nhỏ. Input "Từ mới/Nghĩa/+Thêm" cố định dưới cùng (flexShrink: 0).

---

## 13. Kéo thu nhỏ chỉ còn header + collapse

**Request:** Khi kéo hết xuống, phần "Từ đã lưu" chỉ còn hiện text tiêu đề + nút collapse.

**Cách làm:** Max height = container - 176px (chừa drag handle + vocab header + quick add). Kéo hết → phần từ đã lưu chỉ còn header row.

---

## 14. Fix phần nhập từ cố định

**Request:** Phần "Từ mới/Nghĩa/+Thêm" phải cố định, kéo chỉ ảnh hưởng chiều cao từ đã lưu.

**Cách làm:** Quick add div có `flexShrink: 0` + `background: var(--bg-secondary)`. Nằm ngoài flex container của vocab list. Luôn dính dưới cùng.

---

## 15. Collapse "Từ đã lưu" → gợi ý tự mở rộng

**Request:** Khi collapse từ đã lưu: nếu gợi ý ít → header đứng ngay sau từ cuối; nếu nhiều → scroll. Quick add vẫn đứng im.

**Cách làm:** Khi `vocabCollapsed = true`, div chứa AISuggestionPanel chuyển từ `height: fixed` sang `flex: 1`. Drag handle ẩn. Panel gợi ý tự chiếm không gian còn lại.

---

## 16. Rollback từ "đã lưu" → "đã biết"

**Request:** Thêm tùy chọn trong expanded row "Từ đã lưu" để chuyển từ đó sang "đã biết".

**Cách làm:** Thêm nút "✓ Đã biết" cạnh "Sửa" và "Xoá" trong expanded row. Click → `addKnownWord(lemma)` + `removeWord(id)`.

---

## 17. Panel "Từ đã biết" + nút ✕ đỏ + double-click

**Request:** 
- Cho 1 chỗ xem/search/rollback từ đã biết
- Chuyển dấu ✓ thành ✕ đỏ
- Single click ✕ = confirm, double click ✕ = auto đưa vào known

**Cách làm:**
- Tạo `KnownWordsPanel` (search + list + nút ↩ undo)
- Đổi `<CheckOutlined>` thành `<CloseOutlined>` màu `#ff4d4f`
- Single click → Popconfirm "Bỏ qua từ này?"
- Double click → instant `addKnownWord()` (so sánh timestamp < 300ms)

---

## 18. Đưa "Từ đã biết" sang footer

**Request:** Đưa panel "Từ đã biết" xuống góc dưới bên trái, cạnh các icon (📄 ☆ ☰ 📝).

**Cách làm:** Thêm nút 🧠 ở footer ReaderPage. Click → Antd `<Popover>` chứa `KnownWordsPanel`. Placement: topLeft.

---

## 19. "Từ đã biết" global cho tất cả sách

**Request:** Xác nhận "Từ đã biết" dùng chung cho mọi file, kiểm tra logic.

**Cách làm:** Confirm: `KnownWord` type không có `bookId`, store load toàn bộ bảng (không filter), suggestion engine nhận global set. Đúng ý.

---

## 20. Detect cụm từ đã lưu xuất hiện trên trang

**Request:** Nếu user thêm cụm từ (ví dụ "take into account") ở trang 9, sang trang 11 nếu xuất hiện → phải detect được.

**Cách làm:**
- Thêm bước trong suggestion engine: sau CEFR check, iterate qua `savedLemmas`
- Nếu là cụm từ (chứa space) → dùng `pageText.toLowerCase().includes(phrase)`
- Nếu là từ đơn → check `seenLemmas` (đã tokenize + lemmatize)
- `savedLemmas` giữ nguyên cụm từ (không lemmatize cụm)

---

## 21. Fix bug: bôi đen nghĩa trong popup → popup mới hiện ra

**Request:** Khi bôi đen text trong input "Nghĩa" để sửa → popup cũ biến mất, popup mới hiện ra với từ gốc là đoạn đang bôi.

**Cách làm:** Trong `useTextSelection.ts`, thêm check `selection.anchorNode` — nếu nằm trong `[data-selection-popup]` hoặc `input`/`textarea` → return, không trigger popup mới.

---

## 22. Tooltip khi hover từ trong phần gợi ý

**Request:** Hover vào từ/nghĩa ở phần gợi ý → hiện đầy đủ nội dung (giống phần "Từ đã lưu"), cursor chuyển thành text cursor.

**Cách làm:** Dùng native `title` attribute trên `<Text>` component + `cursor: 'text'`. Luôn hiện tooltip bất kể có bị truncate hay không (giống hành vi của Table `ellipsis: true`).

---

## 23. Fix out of memory khi lật trang

**Request:** Lướt vài chục trang → đơ lag, báo out of memory.

**Cách làm:** Root cause: `extractPageText()` gọi `pdfjs.getDocument()` mỗi lần lật trang → tạo mới document instance mà không destroy. Fix: cache document theo URL, chỉ parse 1 lần, `page.cleanup()` sau extract, `releaseCachedDocument()` khi unmount.

---

## 24. Performance — tách CEFR JSON

**Request:** Tối ưu để trang web đỡ giật lag. Tách cefrData thành file JSON theo level, chỉ load những file cần.

**Cách làm:**
- Tách 4816 từ → 5 file JSON trong `public/data/`
- `cefrData.ts` → thin service (~60 dòng), lazy fetch chỉ levels > userLevel
- Cache trong memory, không re-fetch
- Main bundle nhẹ hơn đáng kể

---

## 25. Rà soát và fix lỗi tiềm ẩn

**Request:** Tìm tất cả lỗi tiềm ẩn có thể ảnh hưởng UX và khắc phục.

**Cách làm:** Phát hiện và fix 6 bugs:
1. Thư viện giữ PDF binary trong RAM → strip fileData khỏi in-memory list
2. Toggle AI không reactive → dùng selector thay vì getState()
3. Upload PDF hỏng → crash im lặng → thêm try/catch + message.error
4. Dịch thuật fail với đoạn dài → truncate max 480 chars
5. NaN% progress khi totalPages=0 → guard condition
6. Regex `.replace('.pdf', '')` sai → đổi thành `/\.pdf$/i`

---

## 26. Tổng hợp tài liệu

**Request:** Tổng hợp toàn bộ thay đổi vào file MD chi tiết + mockup HTML các trạng thái UI.

**Cách làm:** Tạo `docs/SESSION_CHANGELOG.md` (chi tiết kỹ thuật) + `mockup/ai-reader-states.html` (6 trạng thái UI visual).

---

## 27. File tổng hợp yêu cầu (file này)

**Request:** Tạo file tổng hợp tất cả yêu cầu → tóm tắt request và cách làm.

**Cách làm:** File `docs/SESSION_REQUESTS.md` này.