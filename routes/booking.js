const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const filePath = path.join(__dirname, "../data/bookings.json");


const driversList = [
    { name: "Suresh Kumar", phone: "+91 98765 43210", vehicleNo: "TN 07 AB 4589", rating: "4.9 ★" },
    { name: "Ramesh Babu", phone: "+91 98123 45678", vehicleNo: "TN 09 CK 1234", rating: "4.8 ★" },
    { name: "Vimal Raj", phone: "+91 97890 12345", vehicleNo: "TN 14 XY 9876", rating: "4.7 ★" },
    { name: "Karthik Raja", phone: "+91 96543 21098", vehicleNo: "TN 22 EZ 5432", rating: "4.9 ★" },
    { name: "Arun Prakash", phone: "+91 95432 10987", vehicleNo: "TN 01 MS 8899", rating: "4.8 ★" }
];

// -------------------- BOOK RIDE --------------------

router.post("/book", (req, res) => {

    const {
        userEmail,
        pickup,
        drop,
        vehicle,
        fare
    } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error reading bookings file"
            });
        }

        let bookings = [];

        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        // Random driver pick
        const randomDriver = driversList[Math.floor(Math.random() * driversList.length)];

        const booking = {
            id: Date.now(),
            userEmail: userEmail || "guest@ridego.com",
            pickup,
            drop,
            vehicle,
            fare,
            status: "Driver Assigned",
            otp: Math.floor(1000 + Math.random() * 9000).toString(),
            driver: randomDriver,
            bookingDate: new Date().toLocaleString()
        };

        bookings.push(booking);

        fs.writeFile(
            filePath,
            JSON.stringify(bookings, null, 2),
            (err) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Error saving booking"
                    });
                }

                res.json({
                    success: true,
                    message: "Ride Booked Successfully",
                    booking
                });

            }
        );

    });

});


// -------------------- VIEW ALL BOOKINGS --------------------

router.get("/all", (req, res) => {

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error reading bookings"
            });
        }

        let bookings = [];

        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        res.json(bookings);

    });

});


// -------------------- VIEW USER BOOKINGS --------------------

router.get("/user/:email", (req, res) => {
    const userEmail = req.params.email;

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const userBookings = bookings.filter(b => b.userEmail === userEmail);
        res.json({ success: true, bookings: userBookings });
    });
});


// -------------------- VIEW SINGLE BOOKING DETAIL --------------------

router.get("/detail/:id", (req, res) => {
    const bookingId = Number(req.params.id);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            res.json({ success: true, booking });
        } else {
            res.status(404).json({ success: false, message: "Booking not found" });
        }
    });
});


// -------------------- CANCEL RIDE --------------------

router.post("/cancel", (req, res) => {
    const { bookingId } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const bookingIndex = bookings.findIndex(b => b.id === Number(bookingId));

        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = "Cancelled";

            fs.writeFile(filePath, JSON.stringify(bookings, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: "Error updating booking" });
                }
                res.json({ success: true, message: "Ride cancelled successfully", booking: bookings[bookingIndex] });
            });
        } else {
            res.status(404).json({ success: false, message: "Booking not found" });
        }
    });
});


// -------------------- DRIVER: VIEW ASSIGNED RIDES --------------------

router.get("/driver/:driverName", (req, res) => {
    const driverName = req.params.driverName;

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const driverBookings = bookings.filter(b => b.driver && b.driver.name.toLowerCase() === driverName.toLowerCase());
        res.json({ success: true, bookings: driverBookings, driversList });
    });
});


// -------------------- DRIVER: START RIDE (VERIFY OTP) --------------------

router.post("/start-ride", (req, res) => {
    const { bookingId, otp } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const index = bookings.findIndex(b => b.id === Number(bookingId));

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (bookings[index].otp.toString() !== otp.toString().trim()) {
            return res.json({ success: false, message: "Invalid OTP! Please check with customer." });
        }

        bookings[index].status = "In Progress";

        fs.writeFile(filePath, JSON.stringify(bookings, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Error updating booking" });
            }
            res.json({ success: true, message: "OTP Verified! Ride started successfully.", booking: bookings[index] });
        });
    });
});


// -------------------- DRIVER: COMPLETE RIDE --------------------

router.post("/complete-ride", (req, res) => {
    const { bookingId } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error reading bookings" });
        }

        let bookings = [];
        if (data) {
            try {
                bookings = JSON.parse(data);
            } catch (e) {
                bookings = [];
            }
        }

        const index = bookings.findIndex(b => b.id === Number(bookingId));

        if (index === -1) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        bookings[index].status = "Completed";

        fs.writeFile(filePath, JSON.stringify(bookings, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Error updating booking" });
            }
            res.json({ success: true, message: "Ride marked as Completed!", booking: bookings[index] });
        });
    });
});

module.exports = router;