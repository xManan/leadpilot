const fs = require('fs');
const path = require('path');

const LEADS_FILE = path.join(__dirname, 'leads.json');

function readLeads() {
  if (!fs.existsSync(LEADS_FILE)) return [];
  const raw = fs.readFileSync(LEADS_FILE, 'utf8');
  return JSON.parse(raw);
}

function saveLead(lead) {
  const leads = readLeads();
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

module.exports = { saveLead, readLeads };
