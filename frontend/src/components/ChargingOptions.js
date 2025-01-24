import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles2.css";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Slider,
    CircularProgress,
    Alert,
} from "@mui/material";

function ChargingOptions() {
    const { device_id } = useParams(); // Extract device ID from route
    const [deviceDetails, setDeviceDetails] = useState(null);
    const [selectedOption, setSelectedOption] = useState("");
    const [sliderValue, setSliderValue] = useState(0);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [estimatedEnergy, setEstimatedEnergy] = useState(0); // Added state for estimated energy
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const pricing = {
        time: 3, // Cost per minute
        energy: 20, // Cost per kWh
        amount: 1, // Amount-based cost
    };

    const navigate = useNavigate(); // Initialize useNavigate hook

    useEffect(() => {
        if (!device_id) {
            setError("Device ID is missing.");
            return;
        }

        const fetchDeviceDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/devices/${device_id}`);
                if (!response.ok) throw new Error("Failed to fetch device details.");

                const data = await response.json();
                setDeviceDetails(data);
            } catch (err) {
                setError("Failed to load device details. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeviceDetails();
    }, [device_id]);

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        setSliderValue(0);  // Reset slider value upon option change
        setEstimatedCost(0); // Reset estimated cost on option change
        setEstimatedEnergy(0); // Reset estimated energy on option change
    };

    const handleSliderChange = (event, value) => {
        setSliderValue(value);

        if (selectedOption === "energy") {
            setEstimatedCost(value * pricing.energy);
            setEstimatedEnergy(0); // Reset estimated energy
        } else if (selectedOption === "amount") {
            setEstimatedEnergy(value / pricing.energy); // Calculate energy from amount
            setEstimatedCost(value); // Set estimated cost as the selected amount
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedOption || sliderValue === 0) {
            alert("Please select a charging option and value!");
            return;
        }

        try {
            if (typeof window.Razorpay === "undefined") {
                throw new Error("Razorpay SDK not loaded. Please try again.");
            }

            const options = {
                key: "rzp_test_ahZDvz2uwfPVGS", // Replace with your Razorpay API Key
                amount: Math.round(estimatedCost * 100), // Amount in paise
                currency: "INR",
                name: "Sparx Energy",
                description: "Charging Session Payment",
                handler: function (response) {
                    alert("Payment Successful: " + response.razorpay_payment_id);
                    const transactionId = response.razorpay_payment_id; // Payment ID
                    navigate(`/session-status/${transactionId}`, {
                        state: {
                            deviceId: device_id,
                            amountPaid: estimatedCost,
                            chargingOption: selectedOption,
                            energySelected: selectedOption === "energy" ? sliderValue : estimatedEnergy,
                        },
                    });
                },
                prefill: {
                    name: "User Name",
                    email: "user@example.com",
                    contact: "1234567890",
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error("Payment error: ", err.message);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!deviceDetails) {
        return null; // Avoid rendering before data is loaded
    }

    return (
        <Box sx={{
            maxWidth: "380px",
            padding: { xs: 2, sm: 4 },
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
            {/* Device Info Section */}
            <Card sx={{
                mb: 3,
                width: "100%",
                background: "linear-gradient(to right,rgb(190, 32, 204),rgb(95, 7, 167))",
                color: "white"
                ,
            }}>
                <CardContent >
                <Typography variant="h7" textAlign="center"  >
                       Device:
                    </Typography>
                    <Typography variant="h5" textAlign="center" gutterBottom sx={{ fontSize: "1.4rem" }}>
                     {deviceDetails.device_id}
                    </Typography>
                    <Typography textAlign="center">{deviceDetails.location}</Typography>
                    <Typography textAlign="center">{deviceDetails.status === "available" ? "Available" : "Occupied"}</Typography>
                    <Typography textAlign="center">{deviceDetails.charger_type}</Typography>
                </CardContent>
            </Card>

            {/* Charging Options */}
            <Grid container spacing={0} justifyContent="center">
                <Grid item xs={5}>
                    <Card sx={{
                        textAlign: "center",
                        backgroundColor: selectedOption === "energy" ? "#dbaafc" : "#f9f9f9"
                    }} onClick={() => handleOptionSelect("energy")}>
                        <CardContent>
                            <Typography variant="h7">Energy-Based</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={5}>
                    <Card sx={{
                        textAlign: "center",
                        backgroundColor: selectedOption === "amount" ? "#dbaafc" : "#f9f9f9"
                    }} onClick={() => handleOptionSelect("amount")}>
                        <CardContent>
                            <Typography variant="h7">Amount-Based</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Slider Section */}
            {selectedOption && (
                <Box mt={4} width="100%">
                    <Typography variant="h7">
                        {selectedOption === "time" ? "Select Duration (Minutes)"
                            : selectedOption === "energy" ? "Select Energy (kWh) : 20/- per kWh"
                            : "Select Amount (₹)"}
                    </Typography>
                    <Slider
                        value={sliderValue}
                        onChange={handleSliderChange}
                        min={selectedOption === "amount" ? 20 : 0}  // For amount, min is ₹20
                        max={selectedOption === "amount" ? 500 : 50}  // For amount, max is ₹500
                        step={selectedOption === "amount" ? 10 : 2} // Step of ₹10 for amount
                        marks
                        valueLabelDisplay="auto"
                    />
                    <Typography mt={2} color="black" textAlign="center" >
                        {selectedOption === "energy" ? `Selected Energy: ${sliderValue} kWh`
                            : selectedOption === "amount" ? `Selected Amount: ₹${sliderValue}`
                            : ""}
                    </Typography>
                    {selectedOption === "amount" && (
                        <Typography mt={2} color="green" textAlign="center" >
                            Estimated Energy: {estimatedEnergy.toFixed(2)} kWh
                        </Typography>
                    )}
                    {selectedOption === "energy" && (
                        <Typography mt={2} color="green" textAlign="center" >
                            Estimated Cost: ₹{estimatedCost.toFixed()}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Proceed Button */}
            <Box mt={4} textAlign="center" width="100%">
                <Button variant="contained" color="secondary" onClick={handleProceedToPayment} disabled={!selectedOption || sliderValue === 0}>
                    Proceed to Payment
                </Button>
            </Box>
        </Box>
    );
}

export default ChargingOptions;
