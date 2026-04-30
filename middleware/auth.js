module.exports = {

    isAuth: (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/login.html");
        }
        next();
    },

    isAdmin: (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/login.html");
        }

        if (req.session.user.role !== "admin") {
            return res.redirect("/dashboard.html");
        }

        next();
    },

    isEmployee: (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/login.html");
        }

        if (req.session.user.role !== "employee") {
            return res.redirect("/admin.html");
        }

        next();
    }

};