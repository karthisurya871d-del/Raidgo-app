const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const filePath = path.join(__dirname, "../data/users.json");

// -------------------- REGISTER --------------------

router.post("/register", (req, res) => {

    const { name, phone, email, password } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error reading users file"
            });
        }

        let users = [];

        if (data) {
            users = JSON.parse(data);
        }

        // Email already exists
        const userExists = users.find(user => user.email === email);

        if (userExists) {

            return res.json({
                success: false,
                message: "Email already registered"
            });

        }

        users.push({
            name,
            phone,
            email,
            password
        });

        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: "Error saving user"
                });

            }

            res.json({
                success: true,
                message: "Registration Successful"
            });

        });

    });

});


// -------------------- LOGIN --------------------

router.post("/login", (req, res) => {

    const { email, password } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Error reading users file"
            });

        }

        let users = [];

        if (data) {
            users = JSON.parse(data);
        }

        const user = users.find(
            u => u.email === email && u.password === password
        );

        if (user) {

            res.json({
                success: true,
                message: "Login Successful",
                user: {
                    name: user.name,
                    email: user.email
                }
            });

        } else {

            res.json({
                success: false,
                message: "Invalid Email or Password"
            });

        }

    });

});

module.exports = router;