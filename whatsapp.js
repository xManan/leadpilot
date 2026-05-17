const axios = require('axios');

function apiUrl() {
  return `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

async function sendText(to, body) {
  await axios.post(apiUrl(), {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  }, { headers: headers() });
}

// buttons = [{ id: 'btn_id', title: 'Label' }, ...]  max 3
async function sendButtons(to, body, buttons) {
  await axios.post(apiUrl(), {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.map(b => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  }, { headers: headers() });
}

module.exports = { sendText, sendButtons };
