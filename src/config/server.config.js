require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  cors: {
    origin: ['http://localhost:3000','https://metagross-nu.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
}; 