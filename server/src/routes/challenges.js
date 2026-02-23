const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Challenges route working" });
});

module.exports = router;