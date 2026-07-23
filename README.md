# ReadFlow

Ứng dụng đọc PDF với dữ liệu dùng chung giữa máy tính và điện thoại trong cùng mạng LAN.

## Chạy trong mạng LAN

```bash
npm install
npm run dev
```

- Frontend: `http://<IP-máy-tính>:5173`
- API/data server: port `3000` (Vite tự proxy trong lúc phát triển).
- Tìm IPv4 của máy tính bằng `ipconfig`, sau đó mở URL frontend trên điện thoại cùng Wi-Fi.
- Nếu không truy cập được, cho phép Node.js qua Windows Defender Firewall trên mạng Private.

Máy tính phải bật và `npm run dev` phải đang chạy. Phiên bản này dành cho một người dùng trong LAN; không mở port trực tiếp ra Internet.

## Lưu trữ

- SQLite: `data/library.sqlite`
- PDF: `data/books/<book-id>.pdf`
- `data/` không được commit lên GitHub.
- Nút **Sao lưu** tải toàn bộ metadata và PDF thành một file JSON; **Khôi phục** thay thế thư viện server sau khi xác thực bản sao lưu.

Nếu trình duyệt có dữ liệu IndexedDB từ phiên bản cũ, trang thư viện sẽ hiện nút **Chuyển dữ liệu cũ**. Dữ liệu cũ được giữ nguyên sau migration để tránh mất dữ liệu.

## Production

```bash
npm run build
npm start
```

Mở `http://<IP-máy-tính>:3000`. Server production phục vụ cả web, API và PDF trên cùng origin.

## Kiểm tra

```bash
npm run typecheck
npm test
npm run build
```

## Truy cập miễn phí từ xa

Có thể chạy ReadFlow trên máy ở nhà và dùng đồng thời hai đường truy cập miễn phí:

- **Tailscale**: đường riêng tư, ổn định cho các thiết bị đã đăng nhập cùng tailnet.
- **Cloudflare Quick Tunnel**: đường dự phòng tạm thời qua URL `trycloudflare.com`; không cần domain nhưng URL sẽ thay đổi khi khởi động lại.

### 1. Chạy ReadFlow

Trên máy lưu thư viện:

```bash
npm run build
npm start
```

Giữ cửa sổ này mở. Server lắng nghe ở `http://127.0.0.1:3000` (hoặc `http://localhost:3000`). Không cần mở port 3000 trên router.

### 2. Tailscale

Cài Tailscale trên máy chủ và các thiết bị muốn sử dụng, rồi đăng nhập cùng một tài khoản:

- Windows: tải từ [tailscale.com/download](https://tailscale.com/download)
- Điện thoại/laptop công ty: cài ứng dụng Tailscale tương ứng

Sau khi đăng nhập trên máy chủ, lấy địa chỉ Tailscale:

```powershell
tailscale ip
```

Từ thiết bị khác trong tailnet, mở:

```text
http://<tailscale-ip>:3000
```

Nếu phiên bản Tailscale hỗ trợ Serve, có thể dùng HTTPS riêng trong tailnet:

```powershell
tailscale serve --bg http://127.0.0.1:3000
```

Xem URL và trạng thái bằng:

```powershell
tailscale serve status
```

Tailscale là đường nên dùng hằng ngày vì không public thư viện ra Internet.

### 3. Cloudflare Quick Tunnel (không cần domain)

Cài `cloudflared` từ [Cloudflare documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/). Mở cửa sổ terminal thứ hai:

```powershell
cloudflared tunnel --url http://127.0.0.1:3000
```

Cloudflare sẽ in ra một URL dạng:

```text
https://random-name.trycloudflare.com
```

Giữ cửa sổ `cloudflared` mở trong lúc sử dụng. Đây là **Quick Tunnel tạm thời**, URL có thể thay đổi và không phải named tunnel.

> Cảnh báo: Quick Tunnel tạo một URL public. ReadFlow hiện có API upload/xóa sách và endpoint sao lưu/khôi phục, vì vậy chỉ dùng để thử ngắn hạn và không chia sẻ URL. Khi chưa có domain, chưa thể cấu hình Cloudflare Access ổn định cho URL này.

### 4. Có thể chạy cả hai cùng lúc

Đúng. Chạy ba cửa sổ:

```text
Cửa sổ 1: npm start
Cửa sổ 2: tailscale serve --bg http://127.0.0.1:3000
Cửa sổ 3: cloudflared tunnel --url http://127.0.0.1:3000
```

Cả Tailscale và Cloudflare Tunnel đều proxy vào cùng ReadFlow tại port 3000; không cần chạy hai bản app.

### 5. Khi muốn dùng Cloudflare Access ổn định

Cloudflare Access với email OTP cần một domain được thêm vào Cloudflare. Sau khi có domain:

1. Tạo named tunnel trỏ tới `http://127.0.0.1:3000`.
2. Tạo Access Application cho subdomain của tunnel.
3. Tạo policy chỉ cho phép email của bạn.
4. Giữ Tailscale làm đường riêng tư dự phòng.

### Sao lưu

Dữ liệu nằm trong `data/`, gồm SQLite và PDF. Trước khi thử truy cập public, hãy dùng nút **Sao lưu** trong ứng dụng và giữ bản backup ở nơi khác. Không commit thư mục `data/` lên Git.
