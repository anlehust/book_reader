# Ant Design Components & Customizations



## Tổng quan



Project sử dụng Ant Design 6 với dark theme. ConfigProvider wrap toàn bộ app.



---



## Theme Configuration (App.tsx)



```tsx

<ConfigProvider

  theme={{

    algorithm: theme.darkAlgorithm,

    token: {

      colorPrimary: '#6cb4ee',

      borderRadius: 8,

      colorBgContainer: '#1c1c32',

      colorBgElevated: '#242440',

      colorBorder: '#2e2e48',

      colorText: '#e8e8f0',

      colorTextSecondary: '#a0a0b8',

      fontSize: 14,

    },

    components: {

      Card: { colorBgContainer: '#1c1c32' },

      Input: { colorBgContainer: '#141422' },

      Select: { colorBgContainer: '#141422' },

    },

  }}

>

```



---



## Components sử dụng theo page



### Library Page (`LibraryPage.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Tìm kiếm | `Input` | Search sách | `size="large"`, `allowClear` |

| Sắp xếp | `Select` | Sort options | `size="large"`, custom options |

| Loading | `Spin` | Loading state | `size="large"` |

| Thống kê | `Statistic` | Số sách/từ mới/bookmark | Prefix icons |

| Layout grid | `Row`, `Col` | Stats responsive | `gutter={16}` |

| Tiêu đề | `Typography.Title` | Section headers | `level={3}`, `level={5}` |

| Text | `Typography.Text` | Labels, descriptions | `type="secondary"` |

| Empty | `Empty` | Không có kết quả search | `PRESENTED_IMAGE_SIMPLE` |



### Book Card (`BookCard.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Card | `Card` | Container sách | `hoverable`, custom `cover` |

| Progress | `Progress` | Thanh tiến trình | `size="small"`, `showInfo={false}`, `strokeColor="var(--accent)"` |

| Badge trạng thái | `Tag` | "Đang đọc", "✓ Xong", "%" | `color="cyan"`, `color="green"` |

| Text | `Typography.Text` | Title, meta | `strong`, `ellipsis` |

| Xoá | `DeleteOutlined` | Icon xoá | Custom styling, 2-step confirm |



### Upload Zone (`UploadZone.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Upload hero | `Upload.Dragger` | Kéo thả file PDF | Custom `borderColor`, `borderRadius: 16` |

| Upload compact | `Upload.Dragger` | Nút + trong grid | `minHeight: 260` |

| Icon | `InboxOutlined`, `PlusOutlined` | Visual | `fontSize: 48` |

| Button | `Button` | Trigger fallback | `type="text"` |



### Sidebar (`Sidebar.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Tabs | `Tabs` | Bookmark / Highlight | `size="small"`, `centered`, custom labels |

| Card | `Card` | Mỗi bookmark/highlight item | `size="small"`, `hoverable`, `borderLeft: 3px` |

| Empty | `Empty` | Không có item | `PRESENTED_IMAGE_SIMPLE` |

| Badge | `Badge` | Đếm số lượng | `size="small"` |

| Tag | `Tag` | "Trang X" | `color="blue"` |

| Button | `Button` | Bookmark toggle, delete | `type="primary"`, `ghost`, `danger` |

| Space | `Space` | Layout vertical | `direction="vertical"`, `size={10}` |

| Icon | `BookOutlined`, `HighlightOutlined`, `DeleteOutlined` | Tab labels, actions | - |



### Vocab Panel (`VocabPanel.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Table | `Table` | Danh sách từ mới | `size="small"`, `showHeader={false}`, `pagination={false}`, `expandable` |

| Expandable row | `Table expandable` | Xem chi tiết + edit/delete | `expandRowByClick`, `expandIcon: () => null` |

| Input | `Input` | Edit từ/nghĩa, quick add | `size="small"` |

| Button | `Button` | Lưu/Huỷ/Sửa/Xoá/Thêm | `size="small"`, `type="primary"`, `danger` |

| Checkbox | `Checkbox` | Filter "chỉ trang này" | - |

| Empty | `Empty` | Không có từ nào | `PRESENTED_IMAGE_SIMPLE` |

| Tag | `Tag` | Số lượng từ | `color="blue"` |

| Space | `Space` | Form layout | `direction="vertical"`, `size={6}` |

| Icon | `EditOutlined`, `DeleteOutlined`, `CheckOutlined`, `CloseOutlined` | Actions | - |

| Typography | `Typography.Text` | Từ, nghĩa, labels | `strong`, custom fontSize |



### Selection Popup (`SelectionPopup.tsx`)



| Component | Antd | Mục đích | Customization |

|-----------|------|----------|---------------|

| Input | `Input` | Nhập nghĩa, ví dụ, sửa từ | `size="large"`, `variant="borderless"` (cho từ gốc) |

| Button | `Button` | Lưu/Huỷ, nút "Từ mới" | `type="primary"`, `size="large"`, `block` |

| Spin | `Spin` | Loading dịch | `size="small"` |

| Alert | `Alert` | Warning từ trùng | `type="warning"`, `type="info"`, `showIcon` |

| Space | `Space` | Form layout | `direction="vertical"`, `size={12}` |

| Typography | `Typography.Text` | Labels, từ gốc | `type="secondary"`, `strong` |

| Icon | `WarningOutlined` | Indicator trùng từ | `color: #faad14` |



---



## CSS Customizations (index.css)



```css

/* Zebra striping cho vocab table */

.vocab-row-even td {

  background: var(--bg-tertiary) !important;

}

.vocab-row-odd td {

  background: transparent !important;

}

.ant-table-expanded-row td {

  background: var(--bg-secondary) !important;

}



/* Compact table rows */

.ant-table-small .ant-table-tbody > tr > td {

  padding: 6px 8px !important;

}



/* Xoá khoảng trống expand icon column */

.ant-table-small .ant-table-row-expand-icon-cell {

  padding: 0 !important;

  width: 0 !important;

  min-width: 0 !important;

}

.ant-table-small .ant-table-expand-icon-col {

  width: 0 !important;

  min-width: 0 !important;

}

.ant-table-row-indent {

  padding: 0 !important;

  width: 0 !important;

}

```



---



## Custom Components (không dùng Antd)



| Component | File | Lý do tự build |

|-----------|------|----------------|

| ResizablePanel | `ResizablePanel.tsx` | Antd không có panel resize, thư viện ngoài quá nặng cho 1 feature |

| PaginatedViewer | `PaginatedViewer.tsx` | Wrap react-pdf, logic scroll-to-navigate custom |

| ContinuousViewer | `ContinuousViewer.tsx` | IntersectionObserver + lazy render, quá custom |

| useTextSelection | `useTextSelection.ts` | Hook xử lý text selection trên PDF |

| ReaderPage footer | `ReaderPage.tsx` | Layout phức tạp (zoom + controls + progress + nav), Tailwind classes |

| Header | `ReaderPage.tsx` | Quá đơn giản, không cần Antd Layout Header |



---



## Quyết định không dùng Antd cho



1. **PDF Viewer** — react-pdf có logic riêng, Antd không liên quan

2. **Footer controls** — mix nhiều loại control nhỏ gọn, Antd Button/Slider quá cồng kềnh

3. **Reader Header** — chỉ 1 dòng text + 1 nút back, không cần component

4. **Color picker (highlight)** — 4 nút tròn đơn giản, Antd ColorPicker quá overkill

5. **ResizablePanel** — không có equivalent trong Antd, react-resizable-panels nặng



---



## Icons sử dụng (@ant-design/icons)



```

BookOutlined, BookFilled, EditOutlined, DeleteOutlined,

HighlightOutlined, TagOutlined, InboxOutlined, PlusOutlined,

CheckOutlined, CloseOutlined, WarningOutlined

```