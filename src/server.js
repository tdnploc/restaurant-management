const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');   // thêm dòng này

const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===== KẾT NỐI DATABASE SUPABASE ===== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// test kết nối
pool.connect()
  .then(() => console.log("Đã kết nối database Supabase"))
  .catch(err => console.error("Lỗi kết nối database:", err));

/* cho phép các route dùng database */
app.locals.db = pool;
/* ===================================== */

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/statistics', statisticsRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy`);
});