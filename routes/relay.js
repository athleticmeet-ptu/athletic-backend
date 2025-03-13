const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const RelayStudent = require("../models/RelayStudent");
const RelayLock = require("../models/RelayLock");
const assignJerseyNumber = require("../helpers/assignJerseyNumber"); // Assuming you have this function imported


const router = express.Router();

// ✅ Authentication Middleware
const authMiddleware = (req, res, next) => {
  if (req.session.collegeName && req.session.username) {
    next();
  } else {
    console.log("Session Data:", req.session);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// ✅ Cloudinary Multer Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "relay_students",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });
const uploadFields = upload.fields([
  { name: "student1Image", maxCount: 1 },
  { name: "student2Image", maxCount: 1 },
  { name: "student3Image", maxCount: 1 },
  { name: "student4Image", maxCount: 1 },
]);
router.get("/check-urn/:urn", async (req, res) => {
  try {
    const { urn } = req.params;

    // Check if this URN exists in any registered relay event
    const existing = await RelayStudent.findOne({
      "students.urn": urn,
    });

    if (existing) {
      return res.json({
        exists: true,
        event: existing.event,
        college: existing.collegeName,
      });
    }

    res.json({ exists: false });
  } catch (error) {
    console.error("Error checking URN:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
// ✅ GET Relay Event Lock Status
router.get("/relay-status/:event", authMiddleware, async (req, res) => {
  try {
    const { event } = req.params;
    const collegeName = req.session.collegeName;

    const lockDoc = await RelayLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.json({ status: "locked" });
    } else {
      return res.json({ status: "unlocked" });
    }
  } catch (error) {
    console.error("Error fetching lock status:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// ✅ POST Register Relay Team (Single Team per Event)


router.post("/register", authMiddleware, uploadFields,async (req, res) => {
  try {
    console.log("REQ BODY ===>", req.body);
    console.log("REQ FILES ===>", req.files);

    const collegeName = req.session.collegeName;
    const event = req.body.relayEvent;

    if (!event || !collegeName) {
      return res.status(400).json({ success: false, message: "Missing event or college information" });
    }

    // Check if already registered
    const existingTeam = await RelayStudent.findOne({ collegeName, event });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: "You have already registered for this event." });
    }

    // Prepare students array
    const students = [];

    // To store jersey numbers for the response
    const jerseyNumbers = [];

    for (let i = 1; i <= 4; i++) {
      const name = req.body[`student${i}Name`];
      const urn = req.body[`student${i}URN`];
      const gmail = req.body[`student${i}Gmail`];
      const fatherName = req.body[`student${i}FatherName`];
      const age = parseInt(req.body[`student${i}age`], 10);
      const phoneNumber = req.body[`student${i}PhoneNumber`];
      const image = req.files[`student${i}Image`]?.[0]?.path || "";

      // Validation
      if (!name || !urn || !gmail || !fatherName || !age || !phoneNumber) {
        return res.status(400).json({ success: false, message: `All fields are required for student ${i}` });
      }

      // Assign jersey number based on URN
      const jerseyNumber = await assignJerseyNumber(urn, name, collegeName);
      console.log(`✅ Assigned Jersey Number for ${name} (URN: ${urn}): ${jerseyNumber}`);

      // Push jersey number to array for response
      jerseyNumbers.push({ student: i, name, urn, jerseyNumber });

      // Add student to array
      students.push({
        name,
        urn,
        gmail,
        fatherName,
        age,
        phoneNumber,
        image,
        jerseyNumber, // Add jersey number to student object
      });
    }

    // Check lock (optional redundancy)
    let lockDoc = await RelayLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.status(403).json({ success: false, message: "You have already registered for this event." });
    }

    // Create RelayStudent document (without teamIndex)
    const relayTeam = new RelayStudent({
      collegeName,
      event,
      students,
    });

    await relayTeam.save();

    // Lock the event for the college
    if (!lockDoc) {
      await RelayLock.create({
        collegeName,
        eventsLocked: { [event]: true }
      });
    } else {
      lockDoc.eventsLocked[event] = true;
      await lockDoc.save();
    }

    res.status(201).json({
      success: true,
      message: "Team registered successfully!",
      jerseyNumbers, // Return jersey number info
    });

  } catch (error) {
    console.error("❌ Error registering relay team:", error);
    res.status(500).json({ success: false, message: "Server error, try again later!" });
  }
});

// ✅ GET Registered Teams for Logged-in College
router.get("/students", authMiddleware, async (req, res) => {
  try {
    const collegeName = req.session.collegeName;
    const { event } = req.query;

    const filter = { collegeName };
    if (event) filter.event = event;

    const teams = await RelayStudent.find(filter);

    res.json({ success: true, teams });
  } catch (error) {
    console.error("❌ Error fetching relay teams:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
