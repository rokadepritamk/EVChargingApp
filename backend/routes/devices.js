const express = require('express');
const router = express.Router();
const Device = require('../models/device'); // Adjust path as needed

router.get('/', async (req, res) => {
  try {
    const devices = await Device.find({}, 'device_id location status charger_type'); // Only fetch required fields
    res.status(200).json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Error fetching devices', error });
  }
});

module.exports = router;
