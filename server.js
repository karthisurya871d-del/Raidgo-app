const express = require("express");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");
const feedbackRoutes = require("./routes/feedback");

app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/feedback", feedbackRoutes);

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});

// Other Pages
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "register.html"));
});

app.get("/bookride", (req, res) => {
    res.sendFile(path.join(__dirname, "bookride.html"));
});

app.get("/paymentpage", (req, res) => {
    res.sendFile(path.join(__dirname, "payment.html"));
});

app.get("/feedbackpage", (req, res) => {
    res.sendFile(path.join(__dirname, "feedback.html"));
});

app.get("/mybookings", (req, res) => {
    res.sendFile(path.join(__dirname, "mybookings.html"));
});

app.get("/ridestatus", (req, res) => {
    res.sendFile(path.join(__dirname, "ridestatus.html"));
});

app.get("/driver", (req, res) => {
    res.sendFile(path.join(__dirname, "driver.html"));
});

// Server
const PORT = 3000;

app.listen(PORT, () => {
    console.log("===================================");
    console.log(" RideGo Server Started Successfully");
    console.log("===================================");
    console.log(`Server Running : http://localhost:${PORT}`);
});