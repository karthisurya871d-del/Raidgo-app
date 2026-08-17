const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const filePath = path.join(__dirname, "../data/feedback.json");


// -------------------- SUBMIT FEEDBACK --------------------

router.post("/submit", (req, res) => {

    const {
        name,
        rating,
        comments
    } = req.body;

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Error reading feedback file"
            });

        }

        let feedbacks = [];

        if (data) {
            feedbacks = JSON.parse(data);
        }

        const feedback = {
            id: Date.now(),
            name,
            rating,
            comments,
            feedbackDate: new Date().toLocaleString()
        };

        feedbacks.push(feedback);

        fs.writeFile(
            filePath,
            JSON.stringify(feedbacks, null, 2),
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: "Error saving feedback"
                    });

                }

                res.json({
                    success: true,
                    message: "Feedback Submitted Successfully",
                    feedback
                });

            }
        );

    });

});


// -------------------- VIEW ALL FEEDBACK --------------------

router.get("/all", (req, res) => {

    fs.readFile(filePath, "utf8", (err, data) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: "Error reading feedback"
            });

        }

        let feedbacks = [];

        if (data) {
            feedbacks = JSON.parse(data);
        }

        res.json(feedbacks);

    });

});

module.exports = router;