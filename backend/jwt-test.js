const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: '123' },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: process.env.JWT_ACCESS_EXPIRY }
);

console.log('Token:', token);

const decoded = jwt.verify(
  token,
  process.env.JWT_ACCESS_SECRET
);

console.log('Decoded:', decoded);