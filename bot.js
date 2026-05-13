const { saveLead } = require('./leads');
const { notifyBroker } = require('./notify');

// In-memory session store: { phoneNumber: { step, answers } }
const sessions = {};

const QUESTIONS = {
  1: '👋 Welcome to LeadPilot!\n\nAre you looking to:\n1) Buy a property\n2) Invest in property',
  2: '💰 What is your budget range?\n1) Under ₹50L\n2) ₹50L – 1Cr\n3) Above ₹1Cr',
  3: '📅 When are you looking to buy?\n1) Within 3 months\n2) 3–6 months\n3) Just exploring',
  4: '🏗️ Would you be open to a site visit this week?\n1) Yes\n2) No',
  5: '📝 Great! Can I get your name please?',
};

function scoreLead(answers) {
  let score = 0;

  // Intent: buy or invest = 1pt
  if (['1', '2', 'buy', 'invest'].includes(answers.intent?.toLowerCase())) score += 1;

  // Budget: ₹50L or above = 1pt
  if (['2', '3'].includes(answers.budget)) score += 1;

  // Timeline: within 3 months = 2pt, 3–6 months = 1pt
  if (answers.timeline === '1') score += 2;
  else if (answers.timeline === '2') score += 1;

  // Site visit yes = 1pt
  if (answers.siteVisit === '1') score += 1;

  return score;
}

function budgetLabel(val) {
  if (val === '1') return 'Under ₹50L';
  if (val === '2') return '₹50L–1Cr';
  if (val === '3') return 'Above ₹1Cr';
  return val;
}

function timelineLabel(val) {
  if (val === '1') return 'Within 3 months';
  if (val === '2') return '3–6 months';
  if (val === '3') return 'Just exploring';
  return val;
}

function intentLabel(val) {
  if (val === '1') return 'Buy';
  if (val === '2') return 'Invest';
  return val;
}

async function handleMessage(from, text) {
  const input = text.trim();

  // Start or resume session
  if (!sessions[from]) {
    sessions[from] = { step: 1, answers: {} };
    return QUESTIONS[1];
  }

  const session = sessions[from];

  // Store answer for current step then advance
  if (session.step === 1) {
    session.answers.intent = input;
    session.step = 2;
    return QUESTIONS[2];
  }

  if (session.step === 2) {
    session.answers.budget = input;
    session.step = 3;
    return QUESTIONS[3];
  }

  if (session.step === 3) {
    session.answers.timeline = input;
    session.step = 4;
    return QUESTIONS[4];
  }

  if (session.step === 4) {
    session.answers.siteVisit = input;
    session.step = 5;
    return QUESTIONS[5];
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
      siteVisit: session.answers.siteVisit === '1' ? 'Yes' : 'No',
      score,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    saveLead(lead);

    // Fire-and-forget broker notification — don't block the reply
    notifyBroker(lead).catch(err => console.error('Broker notify failed:', err.message));

    // Clear session so they can restart if needed
    delete sessions[from];

    return (
      `✅ Thanks, ${lead.name}! We've received your details.\n\n` +
      `Our team will reach out to you shortly about this beautiful 2BHK in Thane.\n\n` +
      `Have a great day! 🏠`
    );
  }

  // Fallback — shouldn't normally reach here
  delete sessions[from];
  return 'Sorry, something went wrong. Please send any message to start over.';
}

module.exports = { handleMessage };
