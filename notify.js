const axios = require('axios');

// Send the lead summary to the broker's WhatsApp number
async function notifyBroker(lead) {
  const { PHONE_NUMBER_ID, ACCESS_TOKEN, BROKER_WHATSAPP } = process.env;

  const message =
    `🏠 NEW LEAD — LeadPilot\n\n` +
    `Name: ${lead.name}\n` +
    `Intent: ${lead.intent}\n` +
    `Budget: ${lead.budget}\n` +
    `Timeline: ${lead.timeline}\n` +
    `Site Visit: ${lead.siteVisit}\n` +
    `Score: ${lead.score}/5 🔥\n\n` +
    `Received: ${lead.timestamp}`;

  await axios.post(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: BROKER_WHATSAPP,
      type: 'text',
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

module.exports = { notifyBroker };
