require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const postmark = require('postmark');

const app = express();
const PORT = process.env.PORT || 3000;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ===== Predefined allowed prompts =====
const ALLOWED_PROMPTS = [
  'In what ways does a 70/30 split between AI-generated and human-edited content accelerate production while maintaining high quality and brand voice?',
  'What specific advantages does AI bring to modern content marketing strategies, particularly in terms of scalability, personalization, and SEO?',
  'How can integrating AI into a marketing team’s content workflow streamline ideation, creation, and publishing processes?',
  'Can you give real-world examples of AI-generated content used by SaaS companies to drive traffic, engagement, or conversions?',
  'How using AI decreases cost for internal marketing teams for startups on tight budgets?',
  'How can startups on lean budgets reduce content production costs by leveraging AI instead of expanding internal marketing teams?'
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
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Send email using Postmark
  const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_API_TOKEN);
  try {
    await client.sendEmail({
      From: 'info@hyperscriber.com', 
      To: 'info@hyperscriber.com',
      ReplyTo: email,
      Subject: `New Contact Form Submission from ${name}`,
      TextBody: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });
    res.status(200).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error sending contact email with Postmark:', error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
