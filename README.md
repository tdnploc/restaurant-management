# Hệ Thống Quản Lý Nhà Hàng

Ứng dụng web quản lý nhà hàng với Node.js + Express + MySQL.

## Công Nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend  | HTML, CSS, JavaScript |
| Backend   | Node.js, Express.js |
| Database  | MySQL 8.0 |

## Chức Năng

- **Quản lý Menu**: Thêm, sửa, xóa món ăn, đánh giá sao (0-5), bật/tắt trạng thái
- **Tìm kiếm**: Tìm theo tên, mô tả, danh mục
- **Sắp xếp**: Theo giá (thấp→cao / cao→thấp), theo sao, theo tên A-Z / Z-A
- **Quản lý Đơn hàng**: Tạo đơn, cập nhật trạng thái (Chờ → Chuẩn bị → Hoàn thành / Hủy)
- **Thống kê**: Biểu đồ doanh thu theo ngày/tháng/năm, top món bán chạy, phân tích danh mục

## Cấu Trúc

```
restaurant-management/
├── database.sql              ← Script tạo database (không có dữ liệu mẫu)
├── package.json
├── src/
│   ├── server.js
│   ├── config/database.js
│   └── routes/
│       ├── menu.js           ← API menu (CRUD + search + sort)
│       ├── orders.js         ← API đơn hàng
│       └── statistics.js     ← API thống kê
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

## Sơ Đồ Database (ERD)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  menu_items   │       │ order_items   │       │   orders      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──┐   │ id (PK)      │   ┌──►│ id (PK)      │
│ name         │   └───│ menu_item_id  │   │   │ customer_name│
│ price        │       │ order_id ─────│───┘   │ table_number │
│ category     │       │ quantity      │       │ total        │
│ description  │       │ unit_price    │       │ status       │
│ image        │       └──────────────┘       │ created_at   │
│ rating       │                               │ updated_at   │
│ available    │                               └──────────────┘
│ created_at   │
│ updated_at   │
└──────────────┘
```

## Cài Đặt

1. **Tạo database**: Import `database.sql` vào MySQL (phpMyAdmin hoặc terminal)
2. **Cấu hình**: Sửa `src/config/database.js` nếu MySQL có password
3. **Cài thư viện**: `npm install`
4. **Chạy**: `npm start` → mở http://localhost:3000

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET    | `/api/menu?search=...&sort=price_asc` | Lấy menu (có tìm kiếm + sắp xếp) |
| POST   | `/api/menu` | Thêm món mới |
| PUT    | `/api/menu/:id` | Cập nhật món |
| PATCH  | `/api/menu/:id/toggle` | Bật/tắt trạng thái |
| DELETE | `/api/menu/:id` | Xóa món |
| GET    | `/api/orders` | Lấy đơn hàng |
| POST   | `/api/orders` | Tạo đơn hàng |
| PATCH  | `/api/orders/:id/status` | Cập nhật trạng thái |
| GET    | `/api/statistics?type=daily&date=...` | Thống kê |

Sort options: `price_asc`, `price_desc`, `rating_asc`, `rating_desc`, `name_asc`, `name_desc`
