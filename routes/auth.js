const express = require("express");
const bcrypt = require("bcrypt");

module.exports = (db) => {
    const router = express.Router();

    router.post("/login", (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }

        db.get(
            "SELECT * FROM employees WHERE email = ?",
            [email],
            (err, user) => {

                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                if (!user) {
                    return res.status(400).json({ error: "User not found" });
                }

                bcrypt.compare(password, user.password, (err2, match) => {

                    if (err2) {
                        return res.status(500).json({ error: err2.message });
                    }

                    if (!match) {
                        return res.status(400).json({ error: "Wrong password" });
                    }

                    // session
                    req.session.user = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };

                    return res.json({
                        success: true,
                        role: user.role
                    });
                });
            }
        );
    });

    router.get("/logout", (req, res) => {
        req.session.destroy(() => {
            res.redirect("/login.html");
        });
    });

    return router;
};