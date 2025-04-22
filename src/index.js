require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const serverConfig = require('./config/server.config');
const cronRoutes = require('./routes/cron.routes');
const { initializeDefaultTemplate } = require('./models/Template');

// Create Express app
const app = express();

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up CORS
app.use(cors({
  origin: serverConfig.cors.origin,
  methods: serverConfig.cors.methods,
  credentials: serverConfig.cors.credentials
}));

// API routes
app.use('/api/cron', cronRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Cron Server API',
    version: '1.0.0',
    endpoints: {
      cron: '/api/cron'
    },
    docs: '/api-docs'
  });
});

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Self-ping mechanism to prevent Render from freezing the app
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
let pingURL;

function setupPinger() {
  // Determine the URL to ping based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const host = isDevelopment ? 'localhost' : process.env.RENDER_EXTERNAL_URL || process.env.HOST_URL;
  const port = isDevelopment ? PORT : '';
  
  if (!host) {
    console.warn('⚠️ No host defined for self-pinging. Set RENDER_EXTERNAL_URL or HOST_URL in environment.');
    return;
  }
  
  pingURL = isDevelopment 
    ? `http://localhost:${PORT}/api/cron/health` 
    : `${host}/api/cron/health`;
  
  console.log(`🔄 Setting up self-ping to ${pingURL} every ${PING_INTERVAL/1000/60} minutes`);
  
  // Start pinging
  setInterval(() => {
    try {
      const protocol = pingURL.startsWith('https') ? https : require('http');
      const req = protocol.get(pingURL, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ Self-ping successful at ${new Date().toISOString()}`);
        } else {
          console.warn(`⚠️ Self-ping returned status: ${res.statusCode}`);
        }
        res.resume(); // Consume response to free up memory
      });
      
      req.on('error', (err) => {
        console.error('❌ Self-ping failed:', err.message);
      });
      
      req.end();
    } catch (error) {
      console.error('❌ Error during self-ping:', error);
    }
  }, PING_INTERVAL);
}

// Start the server
const PORT = serverConfig.port;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize the default email template if needed
  try {
    await initializeDefaultTemplate();
  } catch (error) {
    console.error('Error initializing email template:', error);
  }
  
  // Setup pinger to keep the service alive on Render
  setupPinger();
}); 