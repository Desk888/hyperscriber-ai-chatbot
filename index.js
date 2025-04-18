require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ===== Predefined allowed prompts =====
const ALLOWED_PROMPTS = [
  'What is your name?',
  'Tell me a joke.',
  'What is the weather today?',
  'What is the time?',
  // Add more prompts as needed
];

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Perplexity Chatbot Express server is running.');
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided.' });
  }
  if (!PERPLEXITY_API_KEY) {
    return res.status(500).json({ error: 'Perplexity API key not set.' });
  }
  // Check if message matches an allowed prompt (case-insensitive, trimmed)
  const normalizedMessage = message.trim().toLowerCase();
  const isAllowed = ALLOWED_PROMPTS.some(
    prompt => normalizedMessage === prompt.trim().toLowerCase()
  );
  if (!isAllowed) {
    return res.status(403).json({
      error: 'Sorry, I can only answer specific questions.',
      allowedPrompts: ALLOWED_PROMPTS
    });
  }
  try {
    // Replace with the correct Perplexity API endpoint and payload as needed
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // The response structure may differ; adjust as needed
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error from Perplexity API:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get response from Perplexity AI.', details: error?.response?.data || error.message });
  }
});

// Contact form endpoint
// Requires the following environment variables in your .env file:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS


// Make sure less secure app access is enabled if using Gmail for testing.
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Create reusable transporter object using SMTP
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set up email transporter.' });
  }

  const mailOptions = {
    from: `Contact Form <${process.env.SMTP_USER}>`,
    to: 'info@hyperscriber',
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    replyTo: email
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
