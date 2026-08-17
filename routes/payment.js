const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const filePath = path.join(__dirname, "../data/payments.json");


// -------------------- PAYMENT --------------------

router.post("/pay", (req, res) => {

    const {
        paymentMethod,
        amount,
        status
    } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Error reading payments file"
            });

        }

        let payments = [];

        if (data) {
            payments = JSON.parse(data);
        }

        const payment = {
            id: Date.now(),
            paymentMethod,
            amount,
            status,
            paymentDate: new Date().toLocaleString()
        };

        payments.push(payment);

        fs.writeFile(
            filePath,
            JSON.stringify(payments, null, 2),
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: "Error saving payment"
                    });

                }

                res.json({
                    success: true,
                    message: "Payment Successful",
                    payment
                });

            }
        );

    });

});


// -------------------- VIEW ALL PAYMENTS --------------------

router.get("/all", (req, res) => {

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Error reading payments"
            });

        }

        let payments = [];

        if (data) {
            payments = JSON.parse(data);
        }

        res.json(payments);

    });

});

module.exports = router;