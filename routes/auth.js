const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const filePath = path.join(__dirname, "../data/users.json");

// Helper: Secure password hashing using Node.js built-in crypto (scrypt)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

// Helper: Secure password verification with backward-compatibility
function verifyPassword(password, storedPassword) {
    if (!storedPassword || !password) return false;
    // Backward compatibility for existing plaintext passwords in local files
    if (!storedPassword.includes(":")) {
        return storedPassword === password;
    }
    try {
        const [salt, originalHash] = storedPassword.split(":");
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
    } catch (e) {
        return false;
    }
}

// Helper: Safe user list retrieval
function getUsers(callback) {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            // If file does not exist yet, return empty list
            if (err.code === "ENOENT") {
                return callback(null, []);
            }
            return callback(err);
        }
        try {
            const users = data ? JSON.parse(data) : [];
            callback(null, users);
        } catch (parseErr) {
            callback(parseErr);
        }
    });
}

// -------------------- REGISTER --------------------

router.post("/register", (req, res) => {
    const { name, phone, email, password } = req.body || {};

    // Server-side validation
    if (!name || !phone || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields (name, phone, email, password) are required."
        });
    }

    const trimmedName = String(name).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format."
        });
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
        return res.status(400).json({
            success: false,
            message: "Phone number must be exactly 10 digits."
        });
    }

    if (String(password).length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long."
        });
    }

    getUsers((err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to process registration at this time."
            });
        }

        // Check if email already registered (case-insensitive)
        const userExists = users.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered. Please log in."
            });
        }

        // Store user with hashed password
        const newUser = {
            id: Date.now(),
            name: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // Ensure data directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFile(filePath, JSON.stringify(users, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to save user record."
                });
            }

            res.status(201).json({
                success: true,
                message: "Registration Successful! Please Login."
            });
        });
    });
});

// -------------------- LOGIN --------------------

router.post("/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter both email and password."
        });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    getUsers((err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to process login at this time."
            });
        }

        const user = users.find(u => u.email && u.email.toLowerCase() === trimmedEmail);

        if (user && verifyPassword(password, user.password)) {
            // If user logged in with legacy plaintext password, upgrade to hash on write
            if (!user.password.includes(":")) {
                user.password = hashPassword(password);
                fs.writeFile(filePath, JSON.stringify(users, null, 2), () => {});
            }

            res.json({
                success: true,
                message: "Login Successful",
                user: {
                    name: user.name,
                    email: user.email
                }
            });
        } else {
            // Generic message prevents username enumeration
            res.status(401).json({
                success: false,
                message: "Invalid Email or Password."
            });
        }
    });
});

module.exports = router;