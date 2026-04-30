const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require('multer');
const upload = multer({ dest: "uploads/" });

const app = express();
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.log("DB ERROR:", err);
    } else {
        console.log("Database connected");
    }
});

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false
}));

/* ================= DB ================= */
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        start_date TEXT,
        sales_total REAL DEFAULT 0,
        leave_balance INTEGER DEFAULT 30
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        amount REAL,
        date TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    start_date TEXT,
    end_date TEXT,
    file TEXT,
    status TEXT DEFAULT 'pending'
)`);
});

/* ================= SEED ADMIN  ================= */
db.get("SELECT id FROM employees WHERE email=?", ["admin@test.com"], async (err, row) => {
    if (!row) {
        const hash = await bcrypt.hash("123456", 10);

        db.run(
            "INSERT INTO employees (name,email,password,role,start_date,sales_total,leave_balance) VALUES (?,?,?,?,?,?,?)",
            ["Admin", "admin@test.com", hash, "admin", "2024-01-01", 0, 30]
        );

        console.log("Admin created");
    }
});

/* ================= PROTECTED PAGES ================= */

//  ADMIN PAGE LOCK
app.get("/admin.html", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    if (req.session.user.role !== "admin") {
        return res.redirect("/dashboard.html");
    }

    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

//  DASHBOARD PAGE LOCK 
app.get("/dashboard.html", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    if (req.session.user.role === "admin") {
        return res.redirect("/admin.html");
    }

    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ================= ROUTES ================= */
app.use("/auth", require("./routes/auth")(db));
app.use("/employee", require("./routes/employee")(db));
app.use("/admin", require("./routes/admin")(db));

/* ================= STATIC  ================= */
app.use(express.static("public"));

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});