require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./bot');

const app = express();
app.use(express.json());

// Serve landing page with WhatsApp number injected from env
app.get('/', (req, res) => {
  const waNumber = process.env.WA_NUMBER || '';
  const html = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8')
    .replace(/{{WHATSAPP_NUMBER}}/g, waNumber);
  res.send(html);
});

app.use(express.static('public'));

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
  res.sendStatus(200); // Respond immediately so Meta doesn't retry

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    const from = message.from;
    let input;

    if (message.type === 'text') {
      input = message.text.body;
      console.log(`[IN] text from ${from}: "${input}"`);
    } else if (message.type === 'interactive') {
      input = message.interactive.button_reply.id;
      console.log(`[IN] button from ${from}: "${input}"`);
    } else {
      console.log(`[IN] ignored message type: ${message.type} from ${from}`);
      return;
    }

    await handleMessage(from, input);
  } catch (err) {
    console.error(`[ERR] Webhook error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LeadPilot running on port ${PORT}`));
