const Jersey = require('../models/Jersey');

const assignJerseyNumber = async (urn, studentName, collegeName) => {
  try {
    // 🔎 Pehle check karta hai ki urn wale bande nu jersey mil chuki hai ke nahi
    const existingJersey = await Jersey.findOne({ urn });

    if (existingJersey) {
      // 👉 Mil chuki hai taan same jersey number return kar dega
      return existingJersey.jerseyNumber;
    }

    // 🧮 Nai mili taan naye jersey number di ginti kari jaandi hai
    const count = await Jersey.countDocuments(); // Total jerseys assigned till now
    const newJerseyNumber = count + 1; // Next number assign hunda

    // 🎽 Nawa jersey record create kita
    const newJersey = new Jersey({
      urn,
      studentName,
      collegeName,
      jerseyNumber: newJerseyNumber
    });

    // 🗂️ Database vich save kar ditta
    await newJersey.save();

    return newJerseyNumber;
  } catch (error) {
    console.error("Error assigning jersey number:", error);
    throw error;
  }
};

module.exports = assignJerseyNumber;
