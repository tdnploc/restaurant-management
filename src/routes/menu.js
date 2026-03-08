const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/menu?search=pho&sort=price_asc|price_desc|rating_asc|rating_desc|name_asc|name_desc
router.get('/', async (req, res) => {
  try {
    const { search, sort } = req.query;

    let sql = 'SELECT * FROM menu_items';
    const params = [];

    // Tìm kiếm theo tên hoặc mô tả
    if (search && search.trim()) {
      sql += ' WHERE (name LIKE ? OR description LIKE ? OR category LIKE ?)';
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    // Sắp xếp
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'rating_asc':
        sql += ' ORDER BY rating ASC';
        break;
      case 'rating_desc':
        sql += ' ORDER BY rating DESC';
        break;
      case 'name_asc':
        sql += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        sql += ' ORDER BY name DESC';
        break;
      default:
        sql += ' ORDER BY category, name';
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi lấy menu:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy món ăn' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/menu
router.post('/', async (req, res) => {
  try {
    const { name, price, category, description, image, rating } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (name, price, category)' });
    }

    const safeRating = Math.min(5, Math.max(0, parseFloat(rating) || 0));

    const [result] = await db.query(
      'INSERT INTO menu_items (name, price, category, description, image, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, category, description || null, image || null, safeRating]
    );

    const [newItem] = await db.query('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (err) {
    console.error('Lỗi thêm món:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/menu/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, price, category, description, image, rating, available } = req.body;

    const [existing] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Không tìm thấy món ăn' });

    const safeRating = rating !== undefined
      ? Math.min(5, Math.max(0, parseFloat(rating) || 0))
      : existing[0].rating;

    await db.query(
      `UPDATE menu_items SET name=?, price=?, category=?, description=?, image=?, rating=?, available=? WHERE id=?`,
      [
        name ?? existing[0].name,
        price ?? existing[0].price,
        category ?? existing[0].category,
        description ?? existing[0].description,
        image ?? existing[0].image,
        safeRating,
        available !== undefined ? available : existing[0].available,
        req.params.id
      ]
    );

    const [updated] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Lỗi cập nhật:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PATCH /api/menu/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Không tìm thấy món ăn' });

    const newAvailable = existing[0].available ? 0 : 1;
    await db.query('UPDATE menu_items SET available=? WHERE id=?', [newAvailable, req.params.id]);

    const [updated] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await db.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Không tìm thấy món ăn' });

    await db.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Đã xóa thành công' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Không thể xóa món đang có trong đơn hàng' });
    }
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
