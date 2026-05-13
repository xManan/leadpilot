const twilio = require('twilio');

// Send the lead summary to the broker's WhatsApp number
async function notifyBroker(lead) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, BROKER_WHATSAPP } = process.env;

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const message =
    `🏠 NEW LEAD — LeadPilot\n\n` +
    `Name: ${lead.name}\n` +
    `Intent: ${lead.intent}\n` +
    `Budget: ${lead.budget}\n` +
    `Timeline: ${lead.timeline}\n` +
    `Site Visit: ${lead.siteVisit}\n` +
    `Score: ${lead.score}/5 🔥\n\n` +
    `Received: ${lead.timestamp}`;

  await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: `whatsapp:+${BROKER_WHATSAPP}`,
    body: message,
  });
}

module.exports = { notifyBroker };
