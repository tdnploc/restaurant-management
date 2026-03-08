-- =============================================
-- Hệ Thống Quản Lý Nhà Hàng - Database Schema
-- MySQL 8.0+
-- =============================================

CREATE DATABASE IF NOT EXISTS restaurant_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_management;

-- Bảng 1: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)    NOT NULL,
  price       DECIMAL(12, 0)  NOT NULL,
  category    VARCHAR(100)    NOT NULL,
  description TEXT            DEFAULT NULL,
  image       VARCHAR(500)    DEFAULT NULL,
  rating      DECIMAL(2, 1)   NOT NULL DEFAULT 0,
  available   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng 2: orders
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  customer_name  VARCHAR(255)  NOT NULL,
  table_number   INT           NOT NULL,
  total          DECIMAL(12, 0) NOT NULL DEFAULT 0,
  status         ENUM('pending', 'preparing', 'completed', 'cancelled')
                   NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng 3: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT             NOT NULL,
  menu_item_id  INT             NOT NULL,
  quantity      INT             NOT NULL DEFAULT 1,
  unit_price    DECIMAL(12, 0)  NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)  ON DELETE RESTRICT
);

-- =============================================
-- DỮ LIỆU MẪU
-- =============================================

-- Menu: 15 món
INSERT INTO menu_items (id, name, price, category, description, image, rating, available) VALUES
(1,  'Phở Bò Tái',           65000,  'Món chính',   'Phở bò truyền thống với thịt bò tái, nước dùng hầm xương 12 tiếng',          'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300&h=200&fit=crop', 4.8, 1),
(2,  'Bún Chả Hà Nội',       55000,  'Món chính',   'Bún chả truyền thống với thịt nướng than hoa thơm ngon',                     'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=300&h=200&fit=crop', 4.5, 1),
(3,  'Chả Cá Lã Vọng',       85000,  'Món chính',   'Chả cá truyền thống với thì là, hành và bánh tráng',                         'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop', 4.2, 1),
(4,  'Cơm Tấm Sườn Bì Chả',  60000,  'Món chính',   'Cơm tấm Sài Gòn với sườn nướng, bì, chả trứng',                             'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop', 4.6, 1),
(5,  'Bò Lúc Lắc',           95000,  'Món chính',   'Thịt bò áp chảo tiêu đen, khoai tây chiên và rau trộn',                     'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop', 4.3, 1),
(6,  'Gỏi Cuốn Tôm Thịt',    35000,  'Khai vị',     'Gỏi cuốn tươi với tôm, thịt, bún và rau sống',                              'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop', 4.4, 1),
(7,  'Chả Giò Rế',           40000,  'Khai vị',     'Chả giò giòn rụm nhân thịt heo, mộc nhĩ, miến',                             'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=200&fit=crop', 4.1, 1),
(8,  'Súp Bào Ngư',          120000, 'Khai vị',     'Súp bào ngư nấu cùng nấm đông cô và trứng cút',                             'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop', 3.9, 0),
(9,  'Chè Ba Màu',           25000,  'Tráng miệng', 'Chè ba màu với đậu xanh, đậu đỏ, thạch và nước cốt dừa',                   'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop', 4.0, 1),
(10, 'Bánh Flan Caramel',    30000,  'Tráng miệng', 'Bánh flan mềm mịn với caramel đắng nhẹ',                                    'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=300&h=200&fit=crop', 4.7, 1),
(11, 'Trà Đá',               10000,  'Đồ uống',     'Trà đá truyền thống pha tươi',                                              'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop', 3.5, 1),
(12, 'Cà Phê Sữa Đá',       25000,  'Đồ uống',     'Cà phê phin Việt Nam pha sữa đặc',                                          'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop', 4.9, 1),
(13, 'Nước Ép Cam Tươi',     35000,  'Đồ uống',     'Cam vắt tươi 100%, không đường',                                            'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&h=200&fit=crop', 4.2, 1),
(14, 'Sinh Tố Bơ',           40000,  'Đồ uống',     'Sinh tố bơ sáp Đắk Lắk xay cùng sữa đặc',                                  'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&h=200&fit=crop', 4.6, 1),
(15, 'Salad Rau Củ',         45000,  'Salad',        'Salad rau củ tươi với sốt vinaigrette',                                     'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop', 3.8, 1);

-- Đơn hàng: 10 đơn
-- Đơn 1: Phở x2 + Cà phê x1 = 130.000 + 25.000 = 155.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(1, 'Nguyễn Văn An',    5, 155000, 'completed', NOW() - INTERVAL 3 HOUR);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(1, 1, 2, 65000),
(1, 12, 1, 25000);

-- Đơn 2: Bún Chả x1 + Gỏi Cuốn x1 + Trà Đá x2 = 55.000 + 35.000 + 20.000 = 110.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(2, 'Trần Thị Bích',    3, 110000, 'completed', NOW() - INTERVAL 2 HOUR);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(2, 2, 1, 55000),
(2, 6, 1, 35000),
(2, 11, 2, 10000);

-- Đơn 3: Bò Lúc Lắc x1 + Salad x1 + Sinh Tố Bơ x1 = 95.000 + 45.000 + 40.000 = 180.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(3, 'Lê Hoàng Nam',     8, 180000, 'preparing', NOW() - INTERVAL 45 MINUTE);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(3, 5, 1, 95000),
(3, 15, 1, 45000),
(3, 14, 1, 40000);

-- Đơn 4: Cơm Tấm x1 + Chả Giò x1 + Trà Đá x2 = 60.000 + 40.000 + 20.000 = 120.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(4, 'Phạm Minh Tuấn',   2, 120000, 'pending', NOW() - INTERVAL 15 MINUTE);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(4, 4, 1, 60000),
(4, 7, 1, 40000),
(4, 11, 2, 10000);

-- Đơn 5: Bò Lúc Lắc x2 + Bánh Flan x2 = 190.000 + 60.000 = 250.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(5, 'Võ Ngọc Hân',      6, 250000, 'completed', NOW() - INTERVAL 1 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(5, 5, 2, 95000),
(5, 10, 2, 30000);

-- Đơn 6: Phở x1 + Bánh Flan x1 = 65.000 + 30.000 = 95.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(6, 'Đặng Quốc Bảo',    4, 95000, 'completed', NOW() - INTERVAL 1 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(6, 1, 1, 65000),
(6, 10, 1, 30000);

-- Đơn 7: Chả Cá x1 + Chè Ba Màu x2 + Sinh Tố Bơ x1 = 85.000 + 50.000 + 40.000 = 175.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(7, 'Huỳnh Thị Mai',    7, 175000, 'completed', NOW() - INTERVAL 2 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(7, 3, 1, 85000),
(7, 9, 2, 25000),
(7, 14, 1, 40000);

-- Đơn 8: Cơm Tấm x2 + Gỏi Cuốn x2 + Nước Cam x2 = 120.000 + 70.000 + 70.000 = 260.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(8, 'Bùi Thanh Tùng',   1, 260000, 'completed', NOW() - INTERVAL 3 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(8, 4, 2, 60000),
(8, 6, 2, 35000),
(8, 13, 2, 35000);

-- Đơn 9: Bún Chả x1 + Chè Ba Màu x1 = 55.000 + 25.000 = 80.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(9, 'Ngô Phương Linh',  9, 80000, 'completed', NOW() - INTERVAL 5 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(9, 2, 1, 55000),
(9, 9, 1, 25000);

-- Đơn 10: Cơm Tấm x1 + Salad x1 + Nước Cam x1 = 60.000 + 45.000 + 35.000 = 140.000
INSERT INTO orders (id, customer_name, table_number, total, status, created_at) VALUES
(10, 'Trịnh Đức Minh', 10, 140000, 'completed', NOW() - INTERVAL 7 DAY);
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES
(10, 4, 1, 60000),
(10, 15, 1, 45000),
(10, 13, 1, 35000);
