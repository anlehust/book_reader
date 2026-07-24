# AI Lazy Reader – Đọc sách tiếng Anh không cần tra từ

## Mục tiêu

Tạo trải nghiệm đọc tiếng Anh "ít ma sát" nhất có thể. Hệ thống chủ động phân tích trang → chỉ hiển thị những gì người dùng có khả năng cần → người dùng chỉ việc đọc.

## Luồng hoạt động

```
Mở PDF → Lật trang → Extract text trang hiện tại
  → Lemmatize (đưa về dạng gốc)
  → Lọc theo CEFR (chỉ lấy từ vượt trình độ user)
  → Loại từ đã lưu (vocabWords)
  → Loại từ đã biết (knownWords)
  → Tra nghĩa từ điển offline
  → Hiển thị trong panel
```

Toàn bộ diễn ra tự động khi chuyển trang, không cần tương tác.

## UI Layout (Right Panel)

```
┌─────────────────────────────────────┐
│  🤖 Gợi ý           [●━━]    [▼]  │
│─────────────────────────────────────│
│  proprietary │ sở hữu riêng [+][✓]│
│  concurrent  │ đồng thời    [+][✓]│
│  leverage    │ tận dụng     [+][✓]│
│ 🟢 deploy    │ triển khai          │
│ 🟢 mitigate  │ giảm nhẹ           │
│                                    │
│  📝 Từ đã lưu          [47] [▼]  │
│─────────────────────────────────────│
│  ubiquitous  │ khắp nơi           │
│  deploy      │ triển khai          │
│  mitigate    │ giảm nhẹ           │
│  ...                               │
│─────────────────────────────────────│
│  [Từ mới...]                       │
│  [Nghĩa...]                        │
│  [+ Thêm]                          │
└─────────────────────────────────────┘
```

### Phần "🤖 Gợi ý"
- Toggle switch (Antd Switch): bật = xanh lá, tắt = xám. Không chữ ON/OFF.
- Tắt = không gọi hàm phân tích, không hiển thị gợi ý.
- Collapse button [▼/▶]: thu gọn/mở rộng section.
- Từ chưa lưu: hiển thị bình thường + nút [+] (lưu vào vocab) và [✓] (đã biết, bỏ qua).
- Từ đã lưu nhưng xuất hiện trên trang: hiện với 🟢 dot xanh lá, không có nút.
- Thứ tự: từ chưa lưu ở trên, từ đã lưu (có dot) ở dưới.

### Phần "📝 Từ đã lưu"
- Collapse button [▼/▶].
- Danh sách từ đã lưu (giống VocabPanel hiện tại).
- Input thêm từ thủ công ở cuối panel.

## Data Model

### Thêm bảng `knownWords` (IndexedDB)
```typescript
interface KnownWord {
  id: string;
  lemma: string;       // dạng gốc của từ
  createdAt: number;
}
```

### Settings mới
```typescript
// Trong useSettingsStore
aiSuggestionEnabled: boolean;  // toggle ON/OFF
userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';  // trình độ CEFR
```

## Kiến trúc kỹ thuật

### Lemmatization
- Sử dụng thư viện `compromise` (~200KB) cho regular forms
- Bổ sung lookup table cho irregular verbs/nouns/adjectives (~10KB JSON)

### CEFR Vocabulary Filter
- Dataset: Oxford 5000 / English Profile dạng JSON
- Mỗi entry: `{ word: string, level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2', pos: string, vi: string }`
- Chỉ hiện từ có level > trình độ user

### Offline Dictionary
- File JSON Anh-Việt bundled vào app
- Fallback cho từ không có trong CEFR list

### Flow filter
```
pageText
  → tokenize (tách từ)
  → lemmatize (về dạng gốc)
  → filter: level > userLevel (chỉ từ khó)
  → filter: NOT in knownWords
  → split: { newWords: NOT in vocabWords, savedOnPage: IN vocabWords }
  → lookup meaning từ dictionary
  → return { newWords, savedOnPage }
```

## Interaction

| Action | Kết quả |
|--------|---------|
| Lật trang | Panel gợi ý tự cập nhật |
| Bấm [+] | Từ chuyển vào "Từ đã lưu", biến mất khỏi gợi ý |
| Bấm [✓] | Từ vào knownWords, biến mất khỏi gợi ý vĩnh viễn |
| Toggle OFF | Ẩn gợi ý, không gọi phân tích |
| Collapse section | Thu gọn/mở rộng |