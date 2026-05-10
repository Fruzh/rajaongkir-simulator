require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const RAJAONGKIR_API = "https://rajaongkir.komerce.id/api/v1";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("CRITICAL ERROR: API Key missing from .env!");
}

app.get('/api/provinces', async (req, res) => {
    try {
        const response = await axios.get(`${RAJAONGKIR_API}/destination/province`, {
            headers: { 'key': API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
});

app.get('/api/cities/:provinceId', async (req, res) => {
    const { provinceId } = req.params;
    try {
        const response = await axios.get(`${RAJAONGKIR_API}/destination/city/${provinceId}`, {
            headers: { 'key': API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
});

app.get('/api/districts/:cityId', async (req, res) => {
    const { cityId } = req.params;
    try {
        const response = await axios.get(`${RAJAONGKIR_API}/destination/district/${cityId}`, {
            headers: { 'key': API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
});

app.post('/api/cost', async (req, res) => {
    const { origin, destination, weight, courier, price } = req.body;
    try {
        const params = new URLSearchParams();
        params.append('origin', origin);
        params.append('destination', destination);
        params.append('weight', weight);
        params.append('courier', courier);
        params.append('price', price || 'lowest');

        const response = await axios.post(
            `${RAJAONGKIR_API}/calculate/district/domestic-cost`,
            params,
            {
                headers: { 
                    'key': API_KEY,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
    }
});

app.listen(PORT, () => {
    console.log('\n\x1b[32m%s\x1b[0m', '──────────────────────────────────────────────────');
    console.log('\x1b[36m%s\x1b[4m%s\x1b[0m', '  Akses Simulator di: ', `http://localhost:${PORT}`);
    console.log('\x1b[32m%s\x1b[0m', '──────────────────────────────────────────────────\n');
});
