const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/statistics?type=daily|monthly|yearly&date=2026-02-27
router.get('/', async (req, res) => {
  try {
    const { type = 'daily', date } = req.query;
    const selectedDate = date ? new Date(date) : new Date();

    const current = await getPeriodData(type, selectedDate);

    const previousDate = new Date(selectedDate);
    if (type === 'daily') previousDate.setDate(previousDate.getDate() - 1);
    else if (type === 'monthly') previousDate.setMonth(previousDate.getMonth() - 1);
    else previousDate.setFullYear(previousDate.getFullYear() - 1);
    const previous = await getPeriodData(type, previousDate);

    const chartData = await getChartData(type, selectedDate);
    const topItems = await getTopItems(type, selectedDate);
    const categoryAnalysis = await getCategoryAnalysis(type, selectedDate);

    res.json({ current, previous, chartData, topItems, categoryAnalysis });
  } catch (err) {
    console.error('Lỗi thống kê:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

async function getPeriodData(type, date) {
  let whereClause = '';
  const params = [];

  switch (type) {
    case 'daily':
      whereClause = 'DATE(o.created_at) = DATE(?)';
      params.push(date);
      break;
    case 'monthly':
      whereClause = 'MONTH(o.created_at) = MONTH(?) AND YEAR(o.created_at) = YEAR(?)';
      params.push(date, date);
      break;
    case 'yearly':
      whereClause = 'YEAR(o.created_at) = YEAR(?)';
      params.push(date);
      break;
  }

  const [rows] = await db.query(
    `SELECT COALESCE(SUM(o.total), 0) AS revenue, COUNT(*) AS orderCount,
            COALESCE(AVG(o.total), 0) AS avgOrderValue
     FROM orders o WHERE ${whereClause} AND o.status = 'completed'`,
    params
  );
  return rows[0];
}

async function getChartData(type, selectedDate) {
  const data = [];

  switch (type) {
    case 'daily':
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const [rows] = await db.query(
          `SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE DATE(created_at) = ? AND status = 'completed'`,
          [dateStr]
        );
        data.push({
          label: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          value: Number(rows[0].value)
        });
      }
      break;
    case 'monthly':
      for (let i = 11; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - i);
        const [rows] = await db.query(
          `SELECT COALESCE(SUM(total), 0) AS value FROM orders
           WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status = 'completed'`,
          [d.getMonth() + 1, d.getFullYear()]
        );
        data.push({
          label: d.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' }),
          value: Number(rows[0].value)
        });
      }
      break;
    case 'yearly':
      for (let i = 4; i >= 0; i--) {
        const year = selectedDate.getFullYear() - i;
        const [rows] = await db.query(
          `SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE YEAR(created_at) = ? AND status = 'completed'`,
          [year]
        );
        data.push({ label: year.toString(), value: Number(rows[0].value) });
      }
      break;
  }
  return data;
}

async function getTopItems(type, date) {
  let whereClause = '';
  const params = [];

  switch (type) {
    case 'daily':
      whereClause = 'DATE(o.created_at) = DATE(?)';
      params.push(date);
      break;
    case 'monthly':
      whereClause = 'MONTH(o.created_at) = MONTH(?) AND YEAR(o.created_at) = YEAR(?)';
      params.push(date, date);
      break;
    case 'yearly':
      whereClause = 'YEAR(o.created_at) = YEAR(?)';
      params.push(date);
      break;
  }

  const [rows] = await db.query(
    `SELECT mi.name, mi.category, SUM(oi.quantity) AS count,
            SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE ${whereClause} AND o.status = 'completed'
     GROUP BY mi.id, mi.name, mi.category
     ORDER BY count DESC LIMIT 5`,
    params
  );
  return rows;
}

async function getCategoryAnalysis(type, date) {
  let whereClause = '';
  const params = [];

  switch (type) {
    case 'daily':
      whereClause = 'DATE(o.created_at) = DATE(?)';
      params.push(date);
      break;
    case 'monthly':
      whereClause = 'MONTH(o.created_at) = MONTH(?) AND YEAR(o.created_at) = YEAR(?)';
      params.push(date, date);
      break;
    case 'yearly':
      whereClause = 'YEAR(o.created_at) = YEAR(?)';
      params.push(date);
      break;
  }

  const [rows] = await db.query(
    `SELECT mi.category, SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE ${whereClause} AND o.status = 'completed'
     GROUP BY mi.category ORDER BY revenue DESC`,
    params
  );
  return rows;
}

module.exports = router;
