const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  device_id: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true },
  charger_type: { type: String, required: true },
  current_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },

});

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;

