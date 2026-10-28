const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();
const filePath = path.join(__dirname, "../data/drivers.json");

// Default initial drivers list for fallback / seed
const defaultDrivers = [
    { name: "Suresh Kumar", phone: "9876543210", email: "suresh@ridego.com", vehicle: "Bike", vehicleNo: "TN 07 AB 4589", rating: "4.9 ★", password: "1234" },
    { name: "Ramesh Babu", phone: "9812345678", email: "ramesh@ridego.com", vehicle: "Auto", vehicleNo: "TN 09 CK 1234", rating: "4.8 ★", password: "1234" },
    { name: "Vimal Raj", phone: "9789012345", email: "vimal@ridego.com", vehicle: "Car", vehicleNo: "TN 14 XY 9876", rating: "4.7 ★", password: "1234" },
    { name: "Karthik Raja", phone: "9654321098", email: "karthik@ridego.com", vehicle: "Car", vehicleNo: "TN 22 EZ 5432", rating: "4.9 ★", password: "1234" },
    { name: "Arun Prakash", phone: "9543210987", email: "arun@ridego.com", vehicle: "Bike", vehicleNo: "TN 01 MS 8899", rating: "4.8 ★", password: "1234" }
];

// Helper: Secure password hashing
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

// Helper: Secure password verification
function verifyPassword(password, storedPassword) {
    if (!storedPassword || !password) return false;
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

// Helper: Read drivers file (auto-seeds if missing)
function getDrivers(callback) {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            if (err.code === "ENOENT") {
                const seeded = defaultDrivers.map((d, idx) => ({
                    id: Date.now() + idx,
                    ...d,
                    password: hashPassword(d.password),
                    createdAt: new Date().toISOString()
                }));
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFile(filePath, JSON.stringify(seeded, null, 2), () => {});
                return callback(null, seeded);
            }
            return callback(err);
        }
        try {
            const drivers = data ? JSON.parse(data) : [];
            callback(null, drivers);
        } catch (parseErr) {
            callback(parseErr);
        }
    });
}

// -------------------- DRIVER REGISTER --------------------

router.post("/register", (req, res) => {
    const { name, phone, email, vehicle, vehicleNo, password } = req.body || {};

    if (!name || !phone || !email || !vehicle || !vehicleNo || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required (Name, Phone, Email, Vehicle Type, Vehicle No, Password)."
        });
    }

    const trimmedName = String(name).trim();
    const trimmedPhone = String(phone).trim();
    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedVehicle = String(vehicle).trim();
    const trimmedVehicleNo = String(vehicleNo).trim().toUpperCase();

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

    if (!["Bike", "Auto", "Car"].includes(trimmedVehicle)) {
        return res.status(400).json({
            success: false,
            message: "Invalid vehicle type. Choose Bike, Auto, or Car."
        });
    }

    if (String(password).length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters long."
        });
    }

    getDrivers((err, drivers) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to process driver registration."
            });
        }

        const emailExists = drivers.find(d => d.email && d.email.toLowerCase() === trimmedEmail);
        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "This email is already registered as a driver."
            });
        }

        const phoneExists = drivers.find(d => d.phone && d.phone === trimmedPhone);
        if (phoneExists) {
            return res.status(409).json({
                success: false,
                message: "This phone number is already registered as a driver."
            });
        }

        const newDriver = {
            id: Date.now(),
            name: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            vehicle: trimmedVehicle,
            vehicleNo: trimmedVehicleNo,
            rating: "5.0 ★",
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };

        drivers.push(newDriver);

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFile(filePath, JSON.stringify(drivers, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({
                    success: false,
                    message: "Unable to save driver record."
                });
            }

            res.status(201).json({
                success: true,
                message: "Driver Registration Successful! Please Login."
            });
        });
    });
});

// -------------------- DRIVER LOGIN --------------------

router.post("/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter both driver email and password."
        });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    getDrivers((err, drivers) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: "Unable to process driver login."
            });
        }

        const driver = drivers.find(d => d.email && d.email.toLowerCase() === trimmedEmail);

        if (driver && verifyPassword(password, driver.password)) {
            // Upgrade plaintext password if legacy
            if (!driver.password.includes(":")) {
                driver.password = hashPassword(password);
                fs.writeFile(filePath, JSON.stringify(drivers, null, 2), () => {});
            }

            res.json({
                success: true,
                message: "Driver Login Successful",
                driver: {
                    id: driver.id,
                    name: driver.name,
                    phone: driver.phone,
                    email: driver.email,
                    vehicle: driver.vehicle,
                    vehicleNo: driver.vehicleNo,
                    rating: driver.rating || "4.8 ★"
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Invalid Driver Email or Password."
            });
        }
    });
});

// -------------------- LIST ACTIVE DRIVERS --------------------

router.get("/list", (req, res) => {
    getDrivers((err, drivers) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading drivers." });
        }
        // Return without password hash
        const publicList = drivers.map(d => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            vehicle: d.vehicle,
            vehicleNo: d.vehicleNo,
            rating: d.rating
        }));
        res.json({ success: true, drivers: publicList });
    });
});

module.exports = router;
