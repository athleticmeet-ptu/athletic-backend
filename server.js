require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const User = require("./models/User");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");

    // Check if collection exists before dropping indexes
    const collections = await mongoose.connection.db.listCollections().toArray();
    const studentsCollectionExists = collections.some(col => col.name === "students");

    if (studentsCollectionExists) {
      await mongoose.connection.collection("students").dropIndexes();
    }
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || "https://ptu.gndecathletix.games";
  
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.status(204).end(); // Ensures response includes CORS headers
    return;
  }

  next();
});


app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student_images",
    allowed_formats: ["jpg", "jpeg"],
  },
});
const upload = multer({ storage });

// Routes
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const relayRoutes = require("./routes/relay");
const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);

app.use("/admin", adminRoutes);
app.use("/", authRoutes);
app.use("/student", studentRoutes);
app.use("/relay", relayRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API Running Successfully!");
});

// Vercel ke liye module export karein (❌ app.listen hata diya)
module.exports = app;
