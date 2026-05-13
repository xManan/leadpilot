require('dotenv').config();
const express = require('express');
const { handleMessage } = require('./bot');

const app = express();
app.use(express.json());
app.use(express.static('public')); // serve landing page

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  // Always reply 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const from = message.from;
    const text = message.text.body;

    const reply = await handleMessage(from, text);
    await sendMessage(from, reply);
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

async function sendMessage(to, body) {
  const axios = require('axios');
  await axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LeadPilot running on port ${PORT}`));
