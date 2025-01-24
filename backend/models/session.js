// models/Session.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true},
  deviceId: { type: String },
  sessionId: { type: String },
  startTime: { type: String },
  startDate: { type: String },
  energyConsumed: { type: Number, default: 0 },
  amountConsumed: { type: Number, default: 0 },
  relayState: { type: String, default: "OFF" }, // ON / OFF
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
