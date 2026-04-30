const express = require("express");
const bcrypt = require("bcrypt");
const { isAdmin } = require("../middleware/auth");

module.exports = (db) => {
    const router = express.Router();

    router.get("/employees", isAdmin, (req, res) => {
        db.all("SELECT * FROM employees", [], (err, rows) => {
            res.json(rows);
        });
    });

    router.post("/employee", isAdmin, async (req, res) => {
        const { name, email, password, role, start_date } = req.body;
        const hash = await bcrypt.hash(password, 10);

        db.run(
            "INSERT INTO employees (name, email, password, role, start_date) VALUES (?, ?, ?, ?, ?)",
            [name, email, hash, role, start_date]
        );

        res.send("Employee added");
    });

    router.post("/sales", isAdmin, (req, res) => {
        const { employee_id, amount, date } = req.body;

        db.run(
            "INSERT INTO sales (employee_id, amount, date) VALUES (?, ?, ?)",
            [employee_id, amount, date]
        );

        res.send("Sale added");
    });

    router.post("/leave/:id/approve", isAdmin, (req, res) => {
        db.run("UPDATE leaves SET status='approved' WHERE id=?", [req.params.id]);
        res.send("Approved");
    });


    router.post("/employee/update", isAdmin, (req, res) => {

        const {
            id,
            name,
            email,
            role,
            sales_total,
            leave_balance
        } = req.body;

        db.get(
            "SELECT id FROM employees WHERE email=? AND id != ?",
            [email, id],
            (err, row) => {

                if (row) {
                    return res.status(400).json({ error: "Email already exists" });
                }

                db.run(
                    `UPDATE employees 
                 SET name=?, email=?, role=?, sales_total=?, leave_balance=? 
                 WHERE id=?`,
                    [name, email, role, sales_total, leave_balance, id],
                    function (err) {
                        if (err) return res.status(500).json({ error: err.message });

                        res.json({ success: true });
                    }
                );
            }
        );
    });

    router.post("/employee/delete", isAdmin, (req, res) => {
        const { id } = req.body;

        db.run("DELETE FROM employees WHERE id=?", [id], function (err) {
            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }

            res.json({ success: true });
        });
    });

    // عرض كل الطلبات
    router.get("/leaves", isAdmin, (req, res) => {
        db.all(`
        SELECT leaves.*, employees.name 
        FROM leaves
        JOIN employees ON employees.id = leaves.employee_id
    `, [], (err, rows) => {
            res.json(rows);
        });
    });

    // قبول الطلب
    router.post("/leave/:id/approve", isAdmin, (req, res) => {

        const id = req.params.id;

        db.run(
            "UPDATE leaves SET status='approved' WHERE id=?",
            [id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                res.json({ success: true });
            }
        );
    });


    // رفض الطلب
    router.post("/leave/:id/reject", isAdmin, (req, res) => {

        const id = req.params.id;

        db.run(
            "UPDATE leaves SET status='rejected' WHERE id=?",
            [id],
            function (err) {

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                res.json({ success: true });
            }
        );
    });

    return router;
};
