require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./bot');

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded data

// Serve landing page with WhatsApp number injected from env
app.get('/', (req, res) => {
  const waNumber = (process.env.TWILIO_WHATSAPP_FROM || '').replace('whatsapp:+', '');
  const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8')
    .replace(/{{WHATSAPP_NUMBER}}/g, waNumber);
  res.send(html);
});

app.use(express.static('public'));

// Incoming WhatsApp messages from Twilio
app.post('/webhook', async (req, res) => {
  try {
    const from = req.body.From; // e.g. "whatsapp:+919876543210"
    const text = req.body.Body;

    if (!from || !text) return res.sendStatus(200);

    const reply = await handleMessage(from, text);

    // Respond with TwiML
    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LeadPilot running on port ${PORT}`));
