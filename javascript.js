// ========================================
// RideGo - Frontend + Backend Connected
// ========================================

// -------------------- API BASE URL CONFIGURATION --------------------
// When deployed on Netlify, either set window.API_BASE_URL to your deployed backend
// (e.g., https://your-backend.onrender.com) or configure a Netlify _redirects proxy.
const API_BASE_URL = (typeof window !== "undefined" && window.API_BASE_URL)
    ? window.API_BASE_URL.replace(/\/$/, "")
    : "";

/**
 * Robust API helper with comprehensive error handling:
 * - Checks HTTP status codes (404, 500, etc.)
 * - Prevents JSON parsing crashes on HTML error pages
 * - Sanitizes errors to prevent credential leakage
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    let response;
    try {
        response = await fetch(url, options);
    } catch (networkError) {
        console.error("Network connectivity error during API request");
        throw new Error("Unable to connect to the backend server. Please verify your internet connection or backend server status.");
    }

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }
    }

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("API endpoint not found (HTTP 404). If using Netlify, your backend server must be deployed and linked.");
        }
        if (data && data.message) {
            throw new Error(data.message);
        }
        throw new Error(`Server returned error status: HTTP ${response.status}`);
    }

    if (!data) {
        throw new Error("Unexpected non-JSON response from server.");
    }

    return data;
}

// -------------------- NAVBAR FUNCTIONS --------------------

function homePage() {
    window.location.href = "/";
}

function bookridepage() {
    window.location.href = "/bookride";
}

function loginPage() {
    window.location.href = "/login";
}

function registerPage() {
    window.location.href = "/register";
}

function paymentPage() {
    window.location.href = "/paymentpage";
}

function feedbackPage() {
    window.location.href = "/feedbackpage";
}

function myBookingsPage() {
    window.location.href = "/mybookings";
}

function rideStatusPage() {
    window.location.href = "/ridestatus";
}

function logout() {
    localStorage.clear();
    alert("Logged out successfully");
    window.location.href = "/";
}

// -------------------- RENDER DYNAMIC NAVBAR --------------------

function renderNavbar() {
    const navUl = document.querySelector("nav ul");
    if (!navUl) return;

    let isLoggedIn = localStorage.getItem("isLoggedIn");
    let userName = localStorage.getItem("name");

    if (isLoggedIn === "true" && userName) {
        navUl.innerHTML = `
            <li><a href="/">Home</a></li>
            <li><a href="/bookride">Book Ride</a></li>
            <li><a href="/mybookings">My Bookings</a></li>
            <li><a href="/driver" style="color:#FFD400; background:#111; padding:4px 10px; border-radius:6px;">Driver Portal</a></li>
            <li style="margin-left:25px; font-weight:bold; color:#111;">👋 Hi, ${userName}</li>
            <li style="margin-left:15px;"><a href="#" onclick="logout(); return false;" style="color:#c62828;">Logout</a></li>
        `;
    } else {
        navUl.innerHTML = `
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/bookride">Book Ride</a></li>
            <li><a href="/mybookings">My Bookings</a></li>
            <li><a href="/driver" style="color:#FFD400; background:#111; padding:4px 10px; border-radius:6px;">Driver Portal</a></li>
        `;
    }
}

// -------------------- BOOK NOW (Home Page) --------------------

function selectRide(vehicle) {
    localStorage.setItem("selectedVehicle", vehicle);

    let isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn == "true") {
        window.location.href = "/bookride";
    } else {
        alert("Please Login First");
        window.location.href = "/login";
    }
}

// -------------------- REGISTER --------------------

function registerUser() {
    let nameElem = document.getElementById("name");
    let phoneElem = document.getElementById("phone");
    let emailElem = document.getElementById("email");
    let passElem = document.getElementById("password");
    let confirmElem = document.getElementById("confirmPassword");

    if (!nameElem || !phoneElem || !emailElem || !passElem || !confirmElem) {
        return false;
    }

    let name     = nameElem.value.trim();
    let phone    = phoneElem.value.trim();
    let email    = emailElem.value.trim();
    let password = passElem.value;
    let confirm  = confirmElem.value;

    if (name === "" || phone === "" || email === "" || password === "" || confirm === "") {
        alert("Please fill in all fields.");
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (!/^\d{10}$/.test(phone)) {
        alert("Enter a valid 10-digit mobile number.");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return false;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return false;
    }

    // Call Backend API via safe apiRequest
    apiRequest("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password })
    })
    .then(data => {
        if (data.success) {
            alert("Registration Successful! Please Login.");
            window.location.href = "/login";
        } else {
            alert(data.message || "Registration failed. Please try again.");
        }
    })
    .catch(err => {
        // Never log secrets or passwords
        console.error("Register Error:", err.message);
        alert(err.message || "Something went wrong. Please try again.");
    });

    return false;
}

// -------------------- LOGIN --------------------

function login() {
    let emailElem = document.getElementById("email");
    let passElem = document.getElementById("password");

    if (!emailElem || !passElem) return;

    let email    = emailElem.value.trim();
    let password = passElem.value;

    if (email === "" || password === "") {
        alert("Please enter email and password.");
        return;
    }

    apiRequest("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(data => {
        if (data.success && data.user) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("name", data.user.name);
            localStorage.setItem("email", data.user.email);
            alert("Login Successful! Welcome " + data.user.name);
            window.location.href = "/";
        } else {
            alert(data.message || "Invalid credentials.");
        }
    })
    .catch(err => {
        console.error("Login Error:", err.message);
        alert(err.message || "Something went wrong. Please try again.");
    });
}

// -------------------- CALCULATE FARE --------------------

function calculateFare() {
    let vehicle = document.getElementById("vehicle").value;
    let fare = 0;

    if (vehicle == "Bike") {
        fare = 80;
    } else if (vehicle == "Auto") {
        fare = 150;
    } else if (vehicle == "Car") {
        fare = 250;
    } else {
        alert("Please Select Vehicle");
        return;
    }

    document.getElementById("fare").innerHTML = "Estimated Fare : ₹ " + fare;
    localStorage.setItem("fare", fare);
}

// -------------------- BOOK RIDE --------------------

function bookRide() {
    let pickup  = document.getElementById("pickup").value.trim();
    let drop    = document.getElementById("drop").value.trim();
    let vehicle = document.getElementById("vehicle").value;
    let userEmail = localStorage.getItem("email") || "guest@ridego.com";

    if (pickup === "" || drop === "" || vehicle === "") {
        alert("Please Fill All Details");
        return;
    }

    let fare = localStorage.getItem("fare") || 0;

    apiRequest("/booking/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, pickup, drop, vehicle, fare })
    })
    .then(data => {
        if (data.success && data.booking) {
            localStorage.setItem("pickup", pickup);
            localStorage.setItem("drop", drop);
            localStorage.setItem("vehicle", vehicle);
            localStorage.setItem("currentBookingId", data.booking.id);
            alert("Ride Booked Successfully! Driver Assigned.");
            window.location.href = "/ridestatus";
        } else {
            alert(data.message || "Booking failed.");
        }
    })
    .catch(err => {
        console.error("Booking Error:", err.message);
        alert(err.message || "Something went wrong. Please try again.");
    });
}

// -------------------- FETCH MY BOOKINGS --------------------

function fetchMyBookings() {
    let userEmail = localStorage.getItem("email");
    let container = document.getElementById("bookingsList");
    if (!container) return;

    if (!userEmail) {
        container.innerHTML = "<p style='text-align:center;'>Please login to view your ride history.</p>";
        return;
    }

    apiRequest(`/booking/user/${encodeURIComponent(userEmail)}`)
    .then(data => {
        if (data.success && data.bookings && data.bookings.length > 0) {
            let html = "";
            data.bookings.slice().reverse().forEach(b => {
                let badgeClass = b.status === "Cancelled" ? "badge-cancelled" : "badge-assigned";
                html += `
                    <div class="booking-card">
                        <div class="booking-info">
                            <h3>${b.vehicle} Ride - ₹ ${b.fare} <span class="status-badge ${badgeClass}">${b.status}</span></h3>
                            <p><strong>📍 Pickup:</strong> ${b.pickup}</p>
                            <p><strong>🏁 Drop:</strong> ${b.drop}</p>
                            <p><strong>📅 Date:</strong> ${b.bookingDate}</p>
                            ${b.driver ? `<p><strong>👨‍✈️ Driver:</strong> ${b.driver.name} (${b.driver.vehicleNo})</p>` : ''}
                        </div>
                        <div>
                            ${b.status !== "Cancelled" ? `
                                <button class="btn-track" onclick="trackBooking(${b.id})">Track Status</button>
                                <button class="btn-cancel" onclick="cancelRide(${b.id})">Cancel Ride</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = "<p style='text-align:center; color:gray;'>No rides found yet. Book your first ride now!</p>";
        }
    })
    .catch(err => {
        console.error("Error fetching bookings:", err.message);
        container.innerHTML = `<p style='text-align:center; color:red;'>${err.message || 'Failed to load bookings.'}</p>`;
    });
}

function trackBooking(id) {
    localStorage.setItem("currentBookingId", id);
    window.location.href = "/ridestatus";
}

// -------------------- LIVE RIDE STATUS --------------------

function loadRideStatus() {
    let bookingId = localStorage.getItem("currentBookingId");
    let container = document.getElementById("statusContainer");
    if (!container) return;

    if (!bookingId) {
        container.innerHTML = "<p>No active booking selected. <a href='/bookride'>Book a Ride</a></p>";
        return;
    }

    apiRequest(`/booking/detail/${encodeURIComponent(bookingId)}`)
    .then(data => {
        if (data.success && data.booking) {
            let b = data.booking;
            let driver = b.driver || { name: "Assigned Driver", phone: "+91 9876543210", vehicleNo: "TN 07 AB 1234", rating: "4.8 ★" };
            let isCancelled = b.status === "Cancelled";

            container.innerHTML = `
                <div class="tracking-card">
                    <h2>Ride Status: <span class="status-badge ${isCancelled ? 'badge-cancelled' : 'badge-assigned'}">${b.status}</span></h2>
                    <p style="margin-top:5px; color:gray;">Booking ID: #${b.id}</p>

                    ${!isCancelled ? `
                        <div class="timeline-step">
                            <div class="timeline-dot"></div>
                            <div class="timeline-line active"></div>
                            <div class="timeline-dot"></div>
                            <div class="timeline-line"></div>
                            <div class="timeline-dot" style="background:#ccc;"></div>
                        </div>

                        <p>Share this OTP with driver to start ride:</p>
                        <div class="otp-box">OTP: ${b.otp || '4829'}</div>

                        <div class="driver-box">
                            <h3>👨‍✈️ Driver Details</h3>
                            <p><strong>Name:</strong> ${driver.name}</p>
                            <p><strong>Vehicle:</strong> ${b.vehicle} (${driver.vehicleNo})</p>
                            <p><strong>Phone:</strong> ${driver.phone}</p>
                            <p><strong>Rating:</strong> ${driver.rating}</p>
                        </div>

                        <div style="margin-top:20px;">
                            <p><strong>📍 Pickup:</strong> ${b.pickup} &nbsp;|&nbsp; <strong>🏁 Drop:</strong> ${b.drop}</p>
                            <p style="margin-top:8px;"><strong>Total Fare:</strong> ₹ ${b.fare}</p>
                        </div>

                        <div style="margin-top:25px; display:flex; justify-content:center; gap:15px;">
                            <button class="btn-track" onclick="window.location.href='/mybookings'">View My Bookings</button>
                            <button class="btn-cancel" onclick="cancelRide(${b.id})">Cancel Ride</button>
                        </div>
                    ` : `
                        <div style="margin: 30px 0; color:#c62828;">
                            <h3>This ride was cancelled.</h3>
                            <button onclick="window.location.href='/bookride'" style="margin-top:15px;">Book Another Ride</button>
                        </div>
                    `}
                </div>
            `;
        } else {
            container.innerHTML = "<p>Booking not found.</p>";
        }
    })
    .catch(err => {
        console.error("Error loading ride status:", err.message);
        container.innerHTML = `<p style="color:red;">${err.message || 'Error loading status.'}</p>`;
    });
}

// -------------------- CANCEL RIDE --------------------

function cancelRide(bookingId) {
    if (!confirm("Are you sure you want to cancel this ride?")) return;

    apiRequest("/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
    })
    .then(data => {
        if (data.success) {
            alert("Ride Cancelled Successfully");
            if (window.location.pathname.includes("ridestatus")) {
                loadRideStatus();
            } else if (window.location.pathname.includes("mybookings")) {
                fetchMyBookings();
            } else {
                window.location.href = "/mybookings";
            }
        } else {
            alert(data.message || "Could not cancel ride.");
        }
    })
    .catch(err => {
        console.error("Cancel error:", err.message);
        alert(err.message || "Could not cancel ride.");
    });
}

// -------------------- PAYMENT --------------------

function payNow() {
    let methodElem = document.getElementById("paymentMethod");
    if (!methodElem) return;

    let method = methodElem.value;
    let fare   = localStorage.getItem("fare") || 0;

    if (method === "") {
        alert("Please Select Payment Method");
        return;
    }

    apiRequest("/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method, amount: fare, status: "Paid" })
    })
    .then(data => {
        if (data.success) {
            alert("Payment Successful!\n\nMethod : " + method);
            window.location.href = "/feedbackpage";
        } else {
            alert(data.message || "Payment could not be processed.");
        }
    })
    .catch(err => {
        console.error("Payment Error:", err.message);
        alert(err.message || "Something went wrong. Please try again.");
    });
}

// -------------------- FEEDBACK --------------------

function submitFeedback() {
    let nameElem = document.getElementById("name");
    let ratingElem = document.getElementById("rating");
    let commentElem = document.getElementById("comments");

    if (!nameElem || !ratingElem || !commentElem) return;

    let name     = nameElem.value.trim();
    let rating   = ratingElem.value;
    let comments = commentElem.value.trim();

    if (name === "" || rating === "" || comments === "") {
        alert("Please fill all fields.");
        return;
    }

    apiRequest("/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, comments })
    })
    .then(data => {
        if (data.success) {
            alert("Thank you for your feedback! 😊");
            window.location.href = "/";
        } else {
            alert(data.message || "Feedback could not be submitted.");
        }
    })
    .catch(err => {
        console.error("Feedback Error:", err.message);
        alert(err.message || "Something went wrong. Please try again.");
    });
}

// -------------------- DRIVER AUTHENTICATION --------------------

function driverLogin(event) {
    if (event) event.preventDefault();

    let emailElem = document.getElementById("driverEmail");
    let passElem = document.getElementById("driverPassword");

    if (!emailElem || !passElem) return false;

    let email = emailElem.value.trim();
    let password = passElem.value;

    if (!email || !password) {
        alert("Please enter driver email and password.");
        return false;
    }

    apiRequest("/driver-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(data => {
        if (data.success && data.driver) {
            localStorage.setItem("isDriverLoggedIn", "true");
            localStorage.setItem("currentDriver", JSON.stringify(data.driver));
            localStorage.setItem("selectedDriverName", data.driver.name);
            alert(`Welcome, ${data.driver.name}! Driver login successful.`);
            window.location.href = "/driver";
        } else {
            alert(data.message || "Invalid driver credentials.");
        }
    })
    .catch(err => {
        console.error("Driver Login Error:", err.message);
        alert(err.message || "Could not log in. Please try again.");
    });

    return false;
}

function driverRegister(event) {
    if (event) event.preventDefault();

    let nameElem = document.getElementById("driverName");
    let phoneElem = document.getElementById("driverPhone");
    let emailElem = document.getElementById("driverEmail");
    let vehicleElem = document.getElementById("driverVehicle");
    let vehicleNoElem = document.getElementById("driverVehicleNo");
    let passElem = document.getElementById("driverPassword");
    let confirmElem = document.getElementById("driverConfirmPassword");

    if (!nameElem || !phoneElem || !emailElem || !vehicleElem || !vehicleNoElem || !passElem || !confirmElem) {
        return false;
    }

    let name = nameElem.value.trim();
    let phone = phoneElem.value.trim();
    let email = emailElem.value.trim();
    let vehicle = vehicleElem.value;
    let vehicleNo = vehicleNoElem.value.trim().toUpperCase();
    let password = passElem.value;
    let confirm = confirmElem.value;

    if (!name || !phone || !email || !vehicle || !vehicleNo || !password || !confirm) {
        alert("Please fill in all driver registration fields.");
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return false;
    }

    if (password !== confirm) {
        alert("Passwords do not match.");
        return false;
    }

    apiRequest("/driver-auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, vehicle, vehicleNo, password })
    })
    .then(data => {
        if (data.success) {
            alert(data.message || "Driver Registered Successfully! Please Login.");
            window.location.href = "/driver-login";
        } else {
            alert(data.message || "Driver registration failed.");
        }
    })
    .catch(err => {
        console.error("Driver Registration Error:", err.message);
        alert(err.message || "Something went wrong during registration.");
    });

    return false;
}

function driverLogout() {
    localStorage.removeItem("isDriverLoggedIn");
    localStorage.removeItem("currentDriver");
    localStorage.removeItem("selectedDriverName");
    alert("Driver logged out successfully.");
    window.location.href = "/driver-login";
}

// -------------------- DRIVER PORTAL FUNCTIONS --------------------

function initDriverPortal() {
    let driverData = localStorage.getItem("currentDriver");
    let currentDriver = null;

    if (driverData) {
        try {
            currentDriver = JSON.parse(driverData);
        } catch (e) {
            currentDriver = null;
        }
    }

    if (!currentDriver || !currentDriver.name) {
        currentDriver = {
            name: "Suresh Kumar",
            vehicle: "Bike",
            vehicleNo: "TN 07 AB 4589",
            phone: "+91 98765 43210",
            rating: "4.9 ★"
        };
    }

    // Populate active driver profile header
    if (document.getElementById("activeDriverName")) {
        document.getElementById("activeDriverName").innerText = currentDriver.name;
    }

    if (document.getElementById("driverBadgeInfo")) {
        document.getElementById("driverBadgeInfo").innerHTML = `
            🚗 <strong>${currentDriver.vehicle || 'Vehicle'}:</strong> ${currentDriver.vehicleNo || 'N/A'} &nbsp;|&nbsp; 
            📱 <strong>Phone:</strong> ${currentDriver.phone || 'N/A'} &nbsp;|&nbsp; 
            ⭐ <strong>Rating:</strong> ${currentDriver.rating || '5.0 ★'}
        `;
    }

    if (document.getElementById("driverNavProfile")) {
        document.getElementById("driverNavProfile").innerText = `👨‍✈️ Driver: ${currentDriver.name}`;
    }

    fetchDriverRides(currentDriver.name);
}

function fetchDriverRides(driverName) {
    if (!driverName) {
        let saved = localStorage.getItem("selectedDriverName");
        driverName = saved || "Suresh Kumar";
    }

    let container = document.getElementById("driverRidesList");
    if (!container) return;

    apiRequest(`/booking/driver/${encodeURIComponent(driverName)}`)
    .then(data => {
        if (data.success && data.bookings) {
            let bookings = data.bookings;

            let total = bookings.length;
            let completed = bookings.filter(b => b.status === "Completed").length;
            let totalEarnings = bookings.filter(b => b.status === "Completed").reduce((sum, b) => sum + (Number(b.fare) || 0), 0);

            if (document.getElementById("statTotalRides")) document.getElementById("statTotalRides").innerText = total;
            if (document.getElementById("statCompletedRides")) document.getElementById("statCompletedRides").innerText = completed;
            if (document.getElementById("statEarnings")) document.getElementById("statEarnings").innerText = `₹ ${totalEarnings}`;

            if (bookings.length === 0) {
                container.innerHTML = "<p style='text-align:center; color:gray; padding: 30px; background:white; border-radius:10px;'>No rides assigned to your profile yet. New bookings will appear here!</p>";
                return;
            }

            let html = "";
            bookings.slice().reverse().forEach(b => {
                let badgeClass = "badge-assigned";
                if (b.status === "In Progress") badgeClass = "badge-inprogress";
                if (b.status === "Completed") badgeClass = "badge-completed";
                if (b.status === "Cancelled") badgeClass = "badge-cancelled";

                html += `
                    <div class="booking-card" style="border-left: 6px solid ${b.status === 'Completed' ? '#2e7d32' : b.status === 'In Progress' ? '#FF9800' : '#2196F3'};">
                        <div class="booking-info">
                            <h3>${b.vehicle} Ride - ₹ ${b.fare} <span class="status-badge ${badgeClass}">${b.status}</span></h3>
                            <p><strong>👤 Customer:</strong> ${b.userEmail}</p>
                            <p><strong>📍 Pickup:</strong> ${b.pickup}</p>
                            <p><strong>🏁 Drop:</strong> ${b.drop}</p>
                            <p><strong>📅 Date:</strong> ${b.bookingDate}</p>
                        </div>
                        <div style="text-align: right; min-width: 200px;">
                            ${b.status === "Driver Assigned" ? `
                                <div style="margin-bottom: 10px;">
                                    <input type="text" id="otp_input_${b.id}" placeholder="Enter 4-digit OTP" style="padding: 8px; width: 140px; border-radius: 6px; border: 1px solid #ccc; text-align: center; font-weight: bold; letter-spacing: 2px;">
                                </div>
                                <button class="btn-track" onclick="startRideWithOTP(${b.id})">Verify OTP & Start</button>
                            ` : ''}

                            ${b.status === "In Progress" ? `
                                <button style="background:#2e7d32; color:white;" onclick="completeRide(${b.id})">✅ Complete Ride</button>
                            ` : ''}

                            ${b.status === "Completed" ? `
                                <p style="color:#2e7d32; font-weight:bold; font-size:14px;">🎉 Trip Completed</p>
                            ` : ''}

                            ${b.status === "Cancelled" ? `
                                <p style="color:#c62828; font-weight:bold; font-size:14px;">❌ Trip Cancelled</p>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        }
    })
    .catch(err => {
        console.error("Error fetching driver rides:", err.message);
        container.innerHTML = `<p style='text-align:center; color:red;'>${err.message || 'Failed to load driver rides.'}</p>`;
    });
}

function startRideWithOTP(bookingId) {
    let input = document.getElementById(`otp_input_${bookingId}`);
    if (!input || !input.value.trim()) {
        alert("Please enter the 4-digit OTP provided by customer.");
        return;
    }

    let otp = input.value.trim();

    apiRequest("/booking/start-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, otp })
    })
    .then(data => {
        if (data.success) {
            alert(data.message || "OTP verified! Ride started.");
            initDriverPortal();
        } else {
            alert(data.message || "OTP verification failed.");
        }
    })
    .catch(err => {
        console.error("OTP Verification Error:", err.message);
        alert(err.message || "Error verifying OTP.");
    });
}

function completeRide(bookingId) {
    if (!confirm("Are you sure you want to mark this ride as completed?")) return;

    apiRequest("/booking/complete-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
    })
    .then(data => {
        if (data.success) {
            alert(data.message || "Ride completed!");
            initDriverPortal();
        } else {
            alert(data.message || "Could not complete ride.");
        }
    })
    .catch(err => {
        console.error("Complete Ride Error:", err.message);
        alert(err.message || "Error completing ride.");
    });
}

// -------------------- PAGE LOAD CHECKS --------------------

window.addEventListener("load", function () {
    renderNavbar();

    // Payment page: show fare
    if (document.getElementById("fareAmount")) {
        let fare = localStorage.getItem("fare");
        if (fare == null) fare = 0;
        document.getElementById("fareAmount").innerHTML = "Total Fare : ₹ " + fare;
    }

    // Bookride page: login check + prefill vehicle
    if (window.location.pathname.includes("bookride")) {
        let isLoggedIn = localStorage.getItem("isLoggedIn");

        if (isLoggedIn != "true") {
            alert("Please Login First");
            window.location.href = "/login";
            return;
        }

        let vehicle = localStorage.getItem("selectedVehicle");
        if (vehicle && document.getElementById("vehicle")) {
            document.getElementById("vehicle").value = vehicle;
        }
    }

    // My Bookings Page Load
    if (window.location.pathname.includes("mybookings")) {
        fetchMyBookings();
    }

    // Ride Status Page Load
    if (window.location.pathname.includes("ridestatus")) {
        loadRideStatus();
    }

    // Driver Portal Page Load (Auth Guard)
    const isDriverDashboard = (window.location.pathname.endsWith("/driver") || window.location.pathname.includes("driver.html")) &&
                             !window.location.pathname.includes("driver-login") &&
                             !window.location.pathname.includes("driver-register");

    if (isDriverDashboard) {
        let isDriverLoggedIn = localStorage.getItem("isDriverLoggedIn");
        if (isDriverLoggedIn !== "true") {
            window.location.href = "/driver-login";
            return;
        }
        initDriverPortal();
    }
});