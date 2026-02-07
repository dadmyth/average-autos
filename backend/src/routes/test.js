import express from 'express';

const router = express.Router();

console.log('🧪 Test routes module loaded');

router.get('/hello', (req, res) => {
  console.log('🧪 Hello route hit!');
  res.json({ success: true, message: 'Hello from test routes!' });
});

export default router;
