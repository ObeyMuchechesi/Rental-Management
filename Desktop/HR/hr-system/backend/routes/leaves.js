const express = require('express');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// GET leaves
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'employee' && req.user.employee) {
      filter.employee = req.user.employee;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.employee) filter.employee = req.query.employee;
    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create leave request
router.post('/', protect, async (req, res) => {
  try {
    const { employee, leaveType, startDate, endDate, reason } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) return res.status(400).json({ message: 'Invalid date range' });

    const leave = await Leave.create({
      employee, leaveType, startDate: start, endDate: end, days, reason
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update leave (approve/reject)
router.put('/:id', protect, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.status = status;
    if (status === 'Approved') {
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      // Deduct from leave balance
      const emp = await Employee.findById(leave.employee);
      if (emp) {
        const typeKey = leave.leaveType.toLowerCase();
        if (emp.leaveBalance[typeKey] !== undefined) {
          emp.leaveBalance[typeKey] = Math.max(0, emp.leaveBalance[typeKey] - leave.days);
          await emp.save();
        }
      }
    } else if (status === 'Rejected') {
      leave.rejectionReason = rejectionReason || '';
    }
    await leave.save();
    res.json(leave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ message: 'Leave deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
