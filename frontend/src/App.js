import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DeviceList from './components/DeviceList';
import ChargingOptions from './components/ChargingOptions';
import Payment from './components/Payment';
import SessionStatus from './components/SessionStatus';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DeviceList />} />
        <Route path="/charging-options/:device_id" element={<ChargingOptions />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/session-status" element={<SessionStatus />} />
        <Route path="/session-status/:transactionId" element={<SessionStatus />} />
        <Route path="/" element={<ChargingOptions />} />
      </Routes>
    </Router>
  );
}


export default App;
