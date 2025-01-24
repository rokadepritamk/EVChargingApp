import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDevices } from "../api";  // Ensure this function is correctly defined in your api.js
import "../styles.css";

function DeviceList() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    getDevices()
      .then(({ data }) => {
        console.log("API Response:", data);
        if (Array.isArray(data)) {
          setDevices(
            data.map((device) => ({
              device_id: device.device_id,
              charger_type: device.charger_type || "Universal 3.3KV",
              location: device.location || "Unknown Location",
              status: device.status || "Unavailable",
            }))
          );
        } else {
          setDevices([]);
        }
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch((err) => {
        console.error("Error fetching devices:", err);
        setError("Failed to fetch devices");
        setLoading(false); // Set loading to false in case of an error
      });
  }, []);

  if (loading) return <p>Loading devices...</p>; // Show loading text while data is being fetched
  if (error) return <p>{error}</p>;
  if (loading) return <div className="spinner"></div>;


  return (
    <div className="app-container">
      {/* Logo with Glowing Ring */}
      <div className="logo-container">
        <div className="glowing-ring">
          <img src="./logo.png" alt="Logo" className="logo" />
        </div>
        <p className="tagline">SAFE - EFFICIENT - RELIABLE</p>
      </div>

      {/* Device List */}
      <div className="device-list">
        {devices.length > 0 ? (
          devices.map((device) => (
            <div key={device.device_id} className="device-card">
              <div className="device-info">
                <img
                  src="./device-image.png"
                  alt="Device"
                  className="device-image"
                />
                <div>
                  <p className="device-id">Device ID: {device.device_id}</p>
                  <p className="device-location">{device.location}</p>
                  <p className="device-type">{device.charger_type}</p>
                </div>
              </div>
              <div
                className={`status ${
                  device.status === "Available" ? "available" : "occupied"
                }`}
              >
                {device.status === "Available" ? (
                  <Link
                    to={`/charging-options/${device.device_id}`}
                    className="status-link available"
                  >
                    ● AVAILABLE
                  </Link>
                ) : (
                  <span className="status-link occupied">● OCCUPIED</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No devices available</p>
        )}
      </div>
    </div>
  );
}

export default DeviceList;
