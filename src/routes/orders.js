const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.id, oi.menu_item_id, mi.name, oi.unit_price AS price, oi.quantity
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error('Lỗi lấy đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.id, oi.menu_item_id, mi.name, oi.unit_price AS price, oi.quantity
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_name, table_number, items } = req.body;

    if (!customer_name || !table_number || !items || items.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin (customer_name, table_number, items)' });
    }

    let total = 0;
    for (const item of items) {
      total += item.price * item.quantity;
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, table_number, total) VALUES (?, ?, ?)',
      [customer_name, table_number, total]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.menu_item_id, item.quantity, item.price]
      );
    }

    await connection.commit();

    const [newOrder] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [orderItems] = await db.query(
      `SELECT oi.id, oi.menu_item_id, mi.name, oi.unit_price AS price, oi.quantity
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    newOrder[0].items = orderItems;

    res.status(201).json(newOrder[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi tạo đơn hàng:', err);
    res.status(500).json({ error: 'Lỗi server' });
  } finally {
    connection.release();
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    const [existing] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

    await db.query('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);

    const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
