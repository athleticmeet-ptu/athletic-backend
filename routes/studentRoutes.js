const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Student = require("../models/Student");
const RelayStudent = require("../models/RelayStudent");
const MaleEventLock = require("../models/eventLock");
const assignJerseyNumber = require("../helpers/assignJerseyNumber");
const { Parser } = require("json2csv");
const Jersey = require("../models/Jersey");

const router = express.Router();

// ✅ Middleware to check session auth
const authMiddleware = (req, res, next) => {
  console.log("Received Headers:", req.headers); // Yeh dekho headers aa rahe hain ya nahi

  const username = req.headers["username"] || req.headers["Username"];
const collegeName = req.headers["collegename"] || req.headers["Collegename"];


  if (collegeName && username) {
    req.collegeName = collegeName;
    req.username = username;
    next();
  } else {
    console.log("Unauthorized Request - Missing Credentials", req.headers);
    res.status(401).json({ message: "Unauthorized" });
  }
};


// ✅ Middleware to check if URN already registered in 2 events
const urnValidationMiddleware = async (req, res, next) => {
  try {
    const {
      student1URN,
      student2URN
    } = req.body;

    const urnsToCheck = [];
    if (student1URN) urnsToCheck.push(student1URN);
    if (student2URN) urnsToCheck.push(student2URN);

    for (const urn of urnsToCheck) {
      // Count registrations in individual events
      const individualCount = await Student.countDocuments({
        $or: [
          { "students.student1.urn": urn },
          { "students.student2.urn": urn }
        ]
      });

      // Count registrations in relay events
      const relayCount = await RelayStudent.countDocuments({
        "students.urn": urn
      });

      const totalEvents = individualCount + relayCount;

      console.log(`URN ${urn} is already registered in ${totalEvents} events.`);

      if (totalEvents >= 2) {
        return res.status(400).json({
          success: false,
          message: `URN ${urn} is already registered in ${totalEvents} event(s). Max 2 allowed.`
        });
      }
    }

    next();
  } catch (error) {
    console.error("❌ URN Validation Error:", error);
    res.status(500).json({ success: false, message: "Server error during URN validation." });
  }
};

// ✅ GET: Registration count for a URN
router.get("/registration-count/:urn", async (req, res) => {
  try {
    const { urn } = req.params;

    const individualCount = await Student.countDocuments({
      $or: [
        { "students.student1.urn": urn },
        { "students.student2.urn": urn },
      ],
    });


    const total = individualCount;

    res.json({ count: total });
  } catch (error) {
    console.error("❌ Error fetching registration count:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});


router.get("/event-status/:event", authMiddleware, async (req, res) => {
  try {
    const { event } = req.params;
    const collegeName = req.headers.collegename;

    if (!collegeName) {
      return res.status(400).json({ status: "error", message: "College name missing" });
    }

    const lockDoc = await MaleEventLock.findOne({ collegeName });

    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.json({ status: "locked" });
    } else {
      return res.json({ status: "unlocked" });
    }
  } catch (error) {
    console.error("❌ Error fetching event lock status:", error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});


// ✅ GET: List students based on event/college
router.get("/students", async (req, res) => {
  try {
    const { event, collegeName } = req.query;
    let filter = {};

    if (event) {
      filter.event = event;
    }

    if (collegeName) {
      filter.collegeName = { $regex: collegeName, $options: "i" };
    }

    const students = await Student.find(filter);

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ✅ GET: Export students and relay students


router.get("/export", async (req, res) => {
  console.log("Export API started...");
  const startTime = Date.now(); // ⏱️ Start time

  try {
    const { collegeName, event } = req.query;

    const studentFilter = {};
    const relayFilter = {};

    if (collegeName) {
      studentFilter.collegeName = collegeName;
      relayFilter.collegeName = collegeName;
    }

    if (event) {
      studentFilter.event = event;
      relayFilter.event = event;
    }

    console.log("Fetching students and relay students...");
    const [students, relayStudents] = await Promise.all([
      Student.find(studentFilter),
      RelayStudent.find(relayFilter),
    ]);
    console.log(`Fetched ${students.length} students and ${relayStudents.length} relay teams`);

    const combinedData = [];

    const processStart = Date.now();

    const studentPromises = students.flatMap((entry) => {
      const promises = [];

      const p1 = Jersey.findOne({ urn: entry.students.student1.urn }).then((jersey1) => ({
        Event: entry.event,
        College: entry.collegeName,
        Name: entry.students.student1.name,
        URN: entry.students.student1.urn,
        Gmail: entry.students.student1.gmail,
        FatherName: entry.students.student1.fatherName,
        Age: entry.students.student1.age,
        PhoneNumber: entry.students.student1.phoneNumber,
        JerseyNumber: jersey1 ? jersey1.jerseyNumber : "N/A",
        ImageURL: entry.students.student1.idCard || "",
        Type: "Individual Event",
      }));

      promises.push(p1);

      if (entry.students.student2 && entry.students.student2.name) {
        const p2 = Jersey.findOne({ urn: entry.students.student2.urn }).then((jersey2) => ({
          Event: entry.event,
          College: entry.collegeName,
          Name: entry.students.student2.name,
          URN: entry.students.student2.urn,
          Gmail: entry.students.student2.gmail,
          FatherName: entry.students.student2.fatherName,
          Age: entry.students.student2.age,
          PhoneNumber: entry.students.student2.phoneNumber,
          JerseyNumber: jersey2 ? jersey2.jerseyNumber : "N/A",
          ImageURL: entry.students.student2.idCard || "",
          Type: "Individual Event",
        }));

        promises.push(p2);
      }

      return promises;
    });

    const relayPromises = relayStudents.flatMap((team) =>
      team.students.map((student) =>
        Jersey.findOne({ urn: student.urn }).then((jersey) => ({
          Event: team.event,
          College: team.collegeName,
          Name: student.name,
          URN: student.urn,
          Gmail: student.gmail,
          FatherName: student.fatherName,
          Age: student.age,
          PhoneNumber: student.phoneNumber,
          JerseyNumber: jersey ? jersey.jerseyNumber : "N/A",
          ImageURL: student.image || "",
          Type: "Relay Event",
        }))
      )
    );

    console.log("Processing jersey numbers...");
    const results = await Promise.all([...studentPromises, ...relayPromises]);

    const processEnd = Date.now();
    console.log(`Processing complete in ${(processEnd - processStart) / 1000} seconds`);

    combinedData.push(...results);

    if (combinedData.length === 0) {
      console.log("No data found for the given filters");
      return res.status(404).json({ message: "No data found for the given filters" });
    }

    const fields = [
      "Event",
      "College",
      "Name",
      "URN",
      "Gmail",
      "FatherName",
      "Age",
      "PhoneNumber",
      "JerseyNumber",
      "ImageURL",
      "Type",
    ];

   console.log("Generating CSV...");
    const opts = { fields };
    const parser = new Parser(opts);
    const csvData = parser.parse(combinedData);
    
    // 👇 Yeh lines add karo custom heading ke liye 👇
    const headerLines = [
      "26th Annual IKGPTU Athletic Championship",
      `Event Name: ${event || "All Events"}`,
      "", // ek blank line spacing ke liye
    ];
    
    // Final CSV data banaya by combining heading aur actual csv data
    const customCsv = `${headerLines.join("\n")}\n${csvData}`;
    // 👆 Yeh ho gaya complete custom CSV 👆
    
    const endTime = Date.now();
    console.log(`Export API finished in ${(endTime - startTime) / 1000} seconds`);
    
    res.header("Content-Type", "text/csv");
    res.attachment("students_data.csv");
    res.send(customCsv);  // Yeh bhej raha hai updated CSV with heading
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Failed to export data" });
  }
});

module.exports = router;


// ✅ Multer + Cloudinary Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "student_images",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "student1Image", maxCount: 1 },
  { name: "student2Image", maxCount: 1 },
]);

// ✅ POST: Register students for an event
router.post("/register", authMiddleware, urnValidationMiddleware, uploadFields, async (req, res) => {
  try {
    const collegeName = req.headers.collegename;
    const {
      events,
      student1Name, student1URN, student1Gmail, student1FatherName, student1age, student1PhoneNumber,
      student2Name, student2URN, student2Gmail, student2FatherName, student2age, student2PhoneNumber
    } = req.body;

    const event = events;

    let lockDoc = await MaleEventLock.findOne({ collegeName });
    if (lockDoc && lockDoc.eventsLocked[event]) {
      return res.status(403).json({ success: false, message: "Event is already locked for this college." });
    }

    const existingEntry = await Student.findOne({ collegeName, event });
    if (existingEntry) {
      return res.status(400).json({ success: false, message: "Already registered for this event." });
    }

    const student1Image = req.files?.student1Image?.[0]?.path || "";
    const student2Image = req.files?.student2Image?.[0]?.path || "";

    const student1JerseyNumber = await assignJerseyNumber(student1URN, student1Name, collegeName);
    let student2JerseyNumber = null;

    if (student2URN) {
      student2JerseyNumber = await assignJerseyNumber(student2URN, student2Name, collegeName);
    }

    const newStudent = new Student({
      collegeName,
      event,
      students: {
        student1: {
          name: student1Name,
          urn: student1URN,
          gmail: student1Gmail,
          fatherName: student1FatherName,
          age: student1age,
          phoneNumber: student1PhoneNumber,
          idCard: student1Image,
          jerseyNumber: student1JerseyNumber,
        },
      },
    });

    if (student2URN) {
      newStudent.students.student2 = {
        name: student2Name,
        urn: student2URN,
        gmail: student2Gmail,
        fatherName: student2FatherName,
        age: student2age,
        phoneNumber: student2PhoneNumber,
        idCard: student2Image,
        jerseyNumber: student2JerseyNumber,
      };
    }
    console.log(student1Image);
    console.log(student2Image);
    await newStudent.save();

    if (!lockDoc) {
      await MaleEventLock.create({
        collegeName,
        eventsLocked: { [event]: true },
      });
    } else {
      lockDoc.eventsLocked[event] = true;
      await lockDoc.save();
    }

    res.json({
      success: true,
      message: "Student registered and event locked successfully!",
      jerseyNumbers: {
        student1JerseyNumber,
        student2JerseyNumber
      }
    });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
