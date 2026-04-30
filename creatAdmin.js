const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./database.db");

(async () => {
    const hash = await bcrypt.hash("123456", 10);

    db.run(
        "INSERT INTO employees (name, email, password, role, start_date) VALUES (?, ?, ?, ?, ?)",
        ["Admin", "admin@test.com", hash, "admin", "2024-01-01"]
    );

    console.log("Admin created");
})();