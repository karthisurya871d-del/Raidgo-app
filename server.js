const express = require("express");
const path = require("path");

const app = express();

// Security / CORS Headers Middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "RideGo API",
        timestamp: new Date().toISOString()
    });
});

// Static Files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");
const feedbackRoutes = require("./routes/feedback");
const driverAuthRoutes = require("./routes/driverAuth");

app.use("/auth", authRoutes);
app.use("/booking", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/driver-auth", driverAuthRoutes);

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

app.get("/driver-login", (req, res) => {
    res.sendFile(path.join(__dirname, "driver-login.html"));
});

app.get("/driver-register", (req, res) => {
    res.sendFile(path.join(__dirname, "driver-register.html"));
});

// Server Listen
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("===================================");
    console.log(" RideGo Server Started Successfully");
    console.log("===================================");
    console.log(`Server Running on port ${PORT}`);
});