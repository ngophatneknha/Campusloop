# CampusLoop

Chợ đồ cũ dành cho sinh viên HUIT. Giao diện được dựng theo bản thiết kế và ảnh mẫu của dự án, hỗ trợ máy tính và điện thoại.

Mã nguồn: https://github.com/ngophatneknha/Campusloop

## Chức năng

- Đăng ký/đăng nhập bằng email và mật khẩu; đổi mật khẩu và đăng xuất.
- Hồ sơ sinh viên, ảnh đại diện, yêu cầu xác minh thẻ sinh viên do quản trị viên xét duyệt.
- Tìm kiếm không phân biệt dấu; lọc danh mục, giá, tình trạng, khu vực và hình thức giao dịch.
- Đăng, sửa, ẩn, xóa tin và tải 1–6 ảnh JPG/PNG/WebP, tối đa 5 MB/ảnh.
- Lưu sản phẩm, nhắn tin riêng, đề nghị mua/trao đổi/xin nhận quà.
- Cả hai bên xác nhận trước khi hoàn tất giao dịch; chỉ đánh giá sau giao dịch thật.
- Báo cáo vi phạm, quản trị tài khoản/tin đăng/báo cáo/danh mục và thống kê.

Tin mẫu được đánh dấu và không dùng để liên hệ hay giao dịch. Thanh toán và giao nhận do hai bên tự thỏa thuận; chưa có thanh toán online, vận chuyển, gửi email xác minh hoặc khôi phục mật khẩu qua email. Đăng ký tài khoản không xác minh quyền sở hữu email hoặc tư cách sinh viên.

## Công nghệ

React, TypeScript, Vinext/Vite, Cloudflare Workers, D1, R2, Drizzle và shadcn/ui. Mật khẩu được băm bằng scrypt với salt ngẫu nhiên. Phiên đăng nhập dùng cookie HttpOnly; cơ sở dữ liệu chỉ lưu mã băm của token. Quyền quản trị được cấp trực tiếp cho tài khoản trong cơ sở dữ liệu, không dựa vào email tự khai báo.

## Chạy cục bộ

Yêu cầu Node.js >=22.13.0. Thực hiện tại thư mục dự án:

```sh
npm ci
npm run db:migrate
npm run dev
```

Mở http://127.0.0.1:5174 rồi đăng ký tài khoản bằng biểu mẫu thật. Cơ sở dữ liệu và ảnh cục bộ được giữ trong thư mục .wrangler, không lưu giả trong trình duyệt.

Để cấp quyền quản trị cho tài khoản đã đăng ký và do bạn kiểm soát:

```sh
npm run admin:grant -- admin@example.com
```

Thay email mẫu bằng tài khoản của bạn. Đăng nhập lại sau khi được cấp quyền. Đối chiếu đúng tài khoản trước khi cấp quyền; email chưa được xác minh tự động. Không có tài khoản hay mật khẩu quản trị mặc định.

## Kiểm tra và build

```sh
npm run typecheck
npm run build
npm start
```

Bản build cục bộ chạy tại http://127.0.0.1:8788. Khi đổi schema, tạo và kiểm tra migration bằng npm run db:generate rồi áp dụng bằng npm run db:migrate. Không sửa migration đã áp dụng.

## Triển khai Cloudflare

1. Đăng nhập bằng npx wrangler login.
2. Tạo D1 bằng npx wrangler d1 create campusloop-db và R2 bằng npx wrangler r2 bucket create campusloop-images.
3. Ghi database_id thật vào wrangler.jsonc; kiểm tra tên bucket và các binding DB/BUCKET. ID trong kho chỉ là giá trị mẫu dành cho chạy cục bộ.
4. Chạy npm run db:migrate:remote, npm run build rồi npm run deploy.
5. Sau khi đăng ký tài khoản trên web đã triển khai, cấp quyền bằng npm run admin:grant -- email-cua-ban@example.com --remote.

Dùng HTTPS khi triển khai. Scrypt cần thời gian CPU và bộ nhớ; chọn giới hạn Workers phù hợp rồi đo trên môi trường thật, không giảm độ mạnh của mật khẩu để vừa gói Free. Có thể điều chỉnh limits.cpu_ms trong cấu hình theo gói của bạn. Không đưa .env, token, dữ liệu .wrangler hoặc khóa bí mật lên GitHub.

## Netlify

Kết nối kho GitHub này vào Netlify chưa đủ để chạy nguyên trạng: máy chủ hiện dùng Cloudflare Workers, D1 và R2. Cần chuyển môi trường máy chủ và cấu hình cơ sở dữ liệu/kho ảnh tương ứng trước khi triển khai đầy đủ trên Netlify. Hệ thống tài khoản của CampusLoop không phụ thuộc dịch vụ đăng nhập bên ngoài.
