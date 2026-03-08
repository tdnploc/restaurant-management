const express = require("express");
const router = express.Router();

// lấy danh sách menu
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(
      "SELECT * FROM menu_items ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;