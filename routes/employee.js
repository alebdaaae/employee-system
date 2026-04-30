const express = require("express");
const { isAuth, isEmployee } = require("../middleware/auth");

module.exports = (db) => {
    const router = express.Router();

    const multer = require("multer");
    const upload = multer({ dest: "uploads/" });

    // بيانات الموظف
    router.get("/me", isAuth, (req, res) => {

        db.get(
            "SELECT name, email, start_date, sales_total, leave_balance FROM employees WHERE id=?",
            [req.session.user.id],
            (err, user) => {

                if (err) {
                    return res.status(500).send(err.message);
                }

                res.json(user);
            }
        );
    });

    // تقديم طلب إجازة
    router.post("/leave", isEmployee, upload.single("file"), (req, res) => {

        const { start_date, end_date } = req.body;
        const employee_id = req.session.user.id;

        const start = new Date(start_date);
        const end = new Date(end_date);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        // ❌ تاريخ في الماضي
        if (start < today) {
            return res.status(400).json({ error: "Start date must be in the future" });
        }

        // ❌ نهاية قبل البداية
        if (end < start) {
            return res.status(400).json({ error: "Invalid date range" });
        }

        // ❌ أكثر من 45 يوم
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);

        if (diffDays > 45) {
            return res.status(400).json({ error: "Leave cannot exceed 45 days" });
        }

        // ❌ لازم ملف
        if (!req.file) {
            return res.status(400).json({ error: "PDF required" });
        }

        db.run(
            "INSERT INTO leaves (employee_id, start_date, end_date, file, status) VALUES (?, ?, ?, ?, 'pending')",
            [employee_id, start_date, end_date, req.file.filename],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.json({ success: true });
            }
        );
    });

    // عرض طلبات الموظف فقط
    router.get("/leaves", isEmployee, (req, res) => {

        db.all(
            "SELECT * FROM leaves WHERE employee_id=?",
            [req.session.user.id],
            (err, rows) => {

                if (err) return res.status(500).json({ error: err.message });

                res.json(rows);
            }
        );
    });

    return router;
};