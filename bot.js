const { sendText, sendButtons } = require('./whatsapp');
const { saveLead } = require('./leads');
const { notifyBroker } = require('./notify');

// In-memory session store: { phoneNumber: { step, answers } }
const sessions = {};

async function handleMessage(from, input) {
  // New user — send Q1
  if (!sessions[from]) {
    sessions[from] = { step: 1, answers: {} };
    await sendButtons(from, '👋 Welcome to LeadPilot!\n\nAre you looking to:', [
      { id: 'intent_buy', title: 'Buy a property' },
      { id: 'intent_invest', title: 'Invest' },
    ]);
    return;
  }

  const session = sessions[from];

  if (session.step === 1) {
    session.answers.intent = input;
    session.step = 2;
    await sendButtons(from, '💰 What is your budget range?', [
      { id: 'budget_low', title: 'Under ₹50L' },
      { id: 'budget_mid', title: '₹50L – 1Cr' },
      { id: 'budget_high', title: 'Above ₹1Cr' },
    ]);
    return;
  }

  if (session.step === 2) {
    session.answers.budget = input;
    session.step = 3;
    await sendButtons(from, '📅 When are you looking to buy?', [
      { id: 'timeline_3m', title: 'Within 3 months' },
      { id: 'timeline_6m', title: '3–6 months' },
      { id: 'timeline_explore', title: 'Just exploring' },
    ]);
    return;
  }

  if (session.step === 3) {
    session.answers.timeline = input;
    session.step = 4;
    await sendButtons(from, '🏗️ Would you be open to a site visit this week?', [
      { id: 'visit_yes', title: 'Yes' },
      { id: 'visit_no', title: 'No' },
    ]);
    return;
  }

  if (session.step === 4) {
    session.answers.siteVisit = input;
    session.step = 5;
    await sendText(from, '📝 Great! Can I get your name please?');
    return;
  }

  if (session.step === 5) {
    session.answers.name = input;

    const score = scoreLead(session.answers);

    const lead = {
      phone: from,
      name: session.answers.name,
      intent: intentLabel(session.answers.intent),
      budget: budgetLabel(session.answers.budget),
      timeline: timelineLabel(session.answers.timeline),
      siteVisit: session.answers.siteVisit === 'visit_yes' ? 'Yes' : 'No',
      score,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    saveLead(lead);
    notifyBroker(lead).catch(err => console.error('Broker notify failed:', err.message));
    delete sessions[from];

    await sendText(from,
      `✅ Thanks, ${lead.name}! We've received your details.\n\n` +
      `Our team will reach out to you shortly about this beautiful 2BHK in Thane.\n\n` +
      `Have a great day! 🏠`
    );
    return;
  }

  // Fallback — clear bad session
  delete sessions[from];
  await sendText(from, 'Sorry, something went wrong. Please send any message to start over.');
}

function scoreLead(answers) {
  let score = 0;
  if (['intent_buy', 'intent_invest'].includes(answers.intent)) score += 1;
  if (['budget_mid', 'budget_high'].includes(answers.budget)) score += 1;
  if (answers.timeline === 'timeline_3m') score += 2;
  else if (answers.timeline === 'timeline_6m') score += 1;
  if (answers.siteVisit === 'visit_yes') score += 1;
  return score;
}

function intentLabel(val) {
  if (val === 'intent_buy') return 'Buy';
  if (val === 'intent_invest') return 'Invest';
  return val;
}

function budgetLabel(val) {
  if (val === 'budget_low') return 'Under ₹50L';
  if (val === 'budget_mid') return '₹50L–1Cr';
  if (val === 'budget_high') return 'Above ₹1Cr';
  return val;
}

function timelineLabel(val) {
  if (val === 'timeline_3m') return 'Within 3 months';
  if (val === 'timeline_6m') return '3–6 months';
  if (val === 'timeline_explore') return 'Just exploring';
  return val;
}

module.exports = { handleMessage };
