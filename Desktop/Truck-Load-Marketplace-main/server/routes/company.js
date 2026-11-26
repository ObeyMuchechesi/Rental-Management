const express = require('express');
const Company = require('../models/Company');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth(), async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.company?._id || req.user.company);
    if (!company) return res.status(404).json({ error: 'NOT_FOUND', message: 'Company not found.' });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

router.patch('/me', auth(), async (req, res, next) => {
  try {
    const fields = ['name', 'phone', 'address', 'taxId'];
    const update = {};
    for (const field of fields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const company = await Company.findByIdAndUpdate(req.user.company?._id || req.user.company, update, {
      new: true,
      runValidators: true,
    });

    res.json(company);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
