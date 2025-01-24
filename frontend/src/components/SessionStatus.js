import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import mqtt from "mqtt";
import axios from "axios";
import "../styles4.css";

const MQTT_BROKER_URL = "e38b21403ada425495d156c12c020e20.s1.eu.hivemq.cloud";
const MQTT_PORT = "8884";
const MQTT_USER = "admin";
const MQTT_PASSWORD = "Admin123";

// MQTT Topics
const TOPIC_VOLTAGE = "device/voltage";
const TOPIC_CURRENT = "device/current";
const TOPIC_RELAY_CONTROL = "device/relayControl"; // For starting/stopping charging

function SessionStatus() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { deviceId, amountPaid, energySelected } = location.state || {};

  const [sessionData, setSessionData] = useState({
    deviceId: deviceId || "Unknown Device",
    sessionId: "",
    startTime: "",
    startDate: "",
    voltage: 0,
    current: 0,
    energyConsumed: 0,
    amountUsed: 0,
  });

  const [charging, setCharging] = useState(false);
  const [relayStartTime, setRelayStartTime] = useState(null);
  const FIXED_RATE_PER_KWH = 20; // ₹20 per kWh

  useEffect(() => {
    const client = mqtt.connect(`wss://${MQTT_BROKER_URL}:${MQTT_PORT}/mqtt`, {
      username: MQTT_USER,
      password: MQTT_PASSWORD,
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe([TOPIC_VOLTAGE, TOPIC_CURRENT], (err) => {
        if (err) console.error("Failed to subscribe to topics");
      });
    });

    client.on("message", (topic, message) => {
      const data = parseFloat(message.toString());

      setSessionData((prev) => {
        let updatedVoltage = prev.voltage;
        let updatedCurrent = prev.current;

        if (topic === TOPIC_VOLTAGE) {
          updatedVoltage = data;
        }
        if (topic === TOPIC_CURRENT) {
          updatedCurrent = data;
        }

        return { ...prev, voltage: updatedVoltage, current: updatedCurrent };
      });
    });

    return () => client.end();
  }, []);

  useEffect(() => {
    if (!transactionId) return;

    const startSession = async () => {
      try {
        const response = await axios.post("http://localhost:5000/api/sessions/start", {
          transactionId,
          deviceId,
          amountPaid,
          energySelected,
        });

        const { sessionId, startTime, startDate } = response.data;

        setSessionData((prev) => ({
          ...prev,
          sessionId,
          startTime,
          startDate,
        }));

        startCharging(); // Auto start charging when session starts
      } catch (error) {
        console.error("Failed to start session:", error.response?.data || error.message);
        navigate("/");
      }
    };

    startSession();
  }, [transactionId]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/sessions/${transactionId}`);
        if (response.data) {
          setSessionData(response.data);
          if (response.data.relayState === "ON") {
            setCharging(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      }
    };
    fetchSession();
  }, [transactionId]);
  

  useEffect(() => {
    if (!charging) return;

    const interval = setInterval(() => {
      setSessionData((prev) => {
        const durationHours = (Date.now() - relayStartTime) / (1000 * 60 * 60);
        const newEnergyConsumed = durationHours * (prev.voltage * prev.current ) / 1000; // kWh
        const newAmountUsed = newEnergyConsumed * FIXED_RATE_PER_KWH ;

        // Stop charging automatically if the amount is fully utilized
        if (newAmountUsed >= amountPaid) {
          stopCharging();
          clearInterval(interval);
        }

        return {
          ...prev,
          energyConsumed: newEnergyConsumed,
          amountUsed: newAmountUsed,
        };
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [charging, relayStartTime]);

  const startCharging = () => {
    const client = mqtt.connect(`wss://${MQTT_BROKER_URL}:${MQTT_PORT}/mqtt`, {
      username: MQTT_USER,
      password: MQTT_PASSWORD,
    });

    client.publish(TOPIC_RELAY_CONTROL, "ON", () => {
      console.log("Charging Started");
      setRelayStartTime(Date.now());
      setCharging(true);
      client.end();
    });
  };

  const stopCharging = async () => {
    try {
      const client = mqtt.connect(`wss://${MQTT_BROKER_URL}:${MQTT_PORT}/mqtt`, {
        username: MQTT_USER,
        password: MQTT_PASSWORD,
      });

      client.publish(TOPIC_RELAY_CONTROL, "OFF", () => {
        console.log("Charging Stopped");
        client.end();
      });

      setCharging(false);
      await axios.post("http://localhost:5000/api/sessions/stop", { sessionId: sessionData.sessionId });
      console.log("Session stopped successfully");
      navigate("/");
    } catch (error) {
      console.error("Failed to stop session:", error);
    }
  };

  return (
    <div className="session-container">
      <div className="top-card">
        <p><strong>Device ID:</strong> {sessionData.deviceId}</p>
        <p><strong>Session ID:</strong> {sessionData.sessionId}</p>
        <p><strong>Start Date & Time:</strong> {sessionData.startDate} {sessionData.startTime}</p>
        <p className={`status ${charging ? "charging" : "stopped"}`}>
          {charging ? "Charging in Progress" : "Charging Stopped"}
        </p>
      </div>

      <div className="charging-progress-card">
        <div className="charging-info">
          <p className="large-text">{amountPaid} ₹</p>
          <p className="small-text">Total Amount Paid</p>

          <p className="large-text">{energySelected} kWh</p>
          <p className="small-text">Energy Selected</p>
          <p className="large-text">{sessionData.amountUsed ? sessionData.amountUsed.toFixed(2) : "0.00"} ₹</p>
          <p className="small-text">Amount Used</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(sessionData.amountUsed / amountPaid) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="live-data">
        <div className="live-value">
          <p className="large-text">{sessionData.voltage} V</p>
          <p className="small-text">Voltage</p>
        </div>
        <div className="live-value">
          <p className="large-text">{sessionData.current} A</p>
          <p className="small-text">Current</p>
        </div>
        <div className="live-value">
        <p className="large-text">{sessionData.energyConsumed ? sessionData.energyConsumed.toFixed(3) : "0.000"} kWh</p>
        <p className="small-text">Energy Consumed</p>
        </div>
      </div>

      {charging && (
        <button className="stop-charging-btn" onClick={stopCharging}>
          Stop Charging
        </button>
      )}
    </div>
  );
}

export default SessionStatus;
