require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

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
app.post('/chat', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
