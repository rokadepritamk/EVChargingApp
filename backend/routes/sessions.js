const express = require("express");
const Session = require("../models/session"); // Import Mongoose schema
const router = express.Router();

// Fetch session by Transaction ID
router.get("/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const session = await Session.findOne({ transactionId });

    if (!session) {
      return res.status(404).json({ error: "Transaction ID not found." });
    }

    res.json(session);
  } catch (err) {
    console.error("Error fetching session:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Start Session (Triggered after payment success)
router.post("/api/sessions/start", async (req, res) => {
  const { sessionId, deviceId, transactionId, startTime, status } = req.body;
  console.log("Received transactionId in /start:", transactionId);

  try {
    // Ensure the transaction ID is unique
    const existingSession = await Session.findOne({ transactionId });
    if (existingSession) {
      return res.status(400).json({ error: "Transaction ID already exists." });
    }

    // Create the new session
    await Session.create({ sessionId, deviceId, transactionId, startTime, status });
    res.status(200).json({ message: "Session started successfully." });
  } catch (err) {
    console.error("Error starting session:", err.message);
    res.status(500).json({ error: "Failed to start session." });
  }
});

// End Session
router.post("/end", async (req, res) => {
  const { sessionId, endTime, voltage, current, energy, amountPaid } = req.body;

  try {
    const updatedSession = await Session.findOneAndUpdate(
      { sessionId },
      { $set: { endTime, voltage, current, energy, amountPaid, status: "completed" } },
      { new: true } // Return the updated document
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "Session ID not found." });
    }

    res.status(200).json({ message: "Session ended successfully.", session: updatedSession });
  } catch (err) {
    console.error("Error ending session:", err.message);
    res.status(500).json({ error: "Failed to end session." });
  }
});

// Handle Payment Success Webhook or Callback
router.post("/payment-success", async (req, res) => {
  const { transactionId, deviceId, sessionId, startTime } = req.body;

  try {
    // Validate incoming data
    if (!transactionId || !deviceId || !sessionId || !startTime) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Check if a session already exists for the transaction ID
    const existingSession = await Session.findOne({ transactionId });
    if (existingSession) {
      return res.status(400).json({ error: "Session already exists for this transaction ID." });
    }

    // Create the session
    await Session.create({
      sessionId,
      deviceId,
      transactionId,
      startTime,
      status: "active",
    });

    res.status(200).json({ message: "Session created successfully after payment." });
  } catch (err) {
    console.error("Error handling payment success:", err.message);
    res.status(500).json({ error: "Failed to process payment success." });
  }
});

module.exports = router;
