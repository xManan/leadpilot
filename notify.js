const { sendText } = require('./whatsapp');

async function notifyBroker(lead) {
  const message =
    `🏠 NEW LEAD — LeadPilot\n\n` +
    `Name: ${lead.name}\n` +
    `Intent: ${lead.intent}\n` +
    `Budget: ${lead.budget}\n` +
    `Timeline: ${lead.timeline}\n` +
    `Site Visit: ${lead.siteVisit}\n` +
    `Score: ${lead.score}/5 🔥\n\n` +
    `Received: ${lead.timestamp}`;

  await sendText(process.env.BROKER_WHATSAPP, message);
}

module.exports = { notifyBroker };
