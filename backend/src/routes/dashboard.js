const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total and active employees
    const totalEmployeesResult = await query('SELECT COUNT(*) as count FROM employees');
    const activeEmployeesResult = await query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    
    // Pending leave requests
    const pendingLeavesResult = await query("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'");
    
    // Today's attendance
    const presentTodayResult = await query("SELECT COUNT(*) as count FROM attendance_records WHERE date = CURDATE() AND status = 'present'");
    const totalActiveResult = await query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'");
    
    const presentToday = presentTodayResult[0]?.count || 0;
    const totalActive = totalActiveResult[0]?.count || 1; // Avoid division by zero
    const attendancePercentage = Math.round((presentToday / totalActive) * 100);
    
    // New joiners this month
    const newJoinersResult = await query(`
      SELECT COUNT(*) as count FROM employees 
      WHERE MONTH(date_of_joining) = MONTH(CURDATE()) 
      AND YEAR(date_of_joining) = YEAR(CURDATE())
    `);
    
    // Department-wise employee count
    const departmentWiseResult = await query(`
      SELECT d.name, d.code, COUNT(e.id) as count 
      FROM departments d 
      LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
      GROUP BY d.id, d.name, d.code
      ORDER BY count DESC
    `);
    
    // Recent activities (last 5)
    const recentActivitiesResult = await query(`
      SELECT action, module, description, created_at, performer_name
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    // Today's birthdays
    const birthdaysResult = await query(`
      SELECT e.id, e.employee_id as emp_code, p.first_name, p.last_name, e.date_of_birth
      FROM employees e
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE DATE_FORMAT(e.date_of_birth, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d')
      AND e.status = 'active'
    `);
    
    // Upcoming holidays (next 3)
    const upcomingHolidaysResult = await query(`
      SELECT * FROM holidays 
      WHERE date >= CURDATE() 
      ORDER BY date ASC 
      LIMIT 3
    `);
    
    res.json({
      totalEmployees: totalEmployeesResult[0]?.count || 0,
      activeEmployees: activeEmployeesResult[0]?.count || 0,
      pendingLeaveRequests: pendingLeavesResult[0]?.count || 0,
      todayAttendance: presentToday,
      presentToday: presentToday,
      attendancePercentage: attendancePercentage,
      newJoinersThisMonth: newJoinersResult[0]?.count || 0,
      departmentWiseCount: departmentWiseResult || [],
      recentActivities: recentActivitiesResult || [],
      todayBirthdays: birthdaysResult || [],
      upcomingHolidays: upcomingHolidaysResult || []
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/employee-stats - Get stats for employee dashboard
router.get('/employee-stats', async (req, res) => {
  try {
    const employees = await query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
    if (employees.length === 0) {
      return res.json({
        leaveBalance: 0,
        pendingRequests: 0,
        attendanceThisMonth: 0,
        workHoursThisMonth: 0
      });
    }
    
    const empId = employees[0].id;
    
    // Pending leave requests
    const pendingResult = await query(
      "SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = ? AND status = 'pending'",
      [empId]
    );
    
    // Total leave balance
    const balanceResult = await query(
      'SELECT SUM(total_days - used_days - pending_days) as balance FROM leave_balances WHERE employee_id = ? AND year = YEAR(CURDATE())',
      [empId]
    );
    
    // Attendance this month
    const attendanceResult = await query(`
      SELECT COUNT(*) as count FROM attendance_records 
      WHERE employee_id = ? 
      AND MONTH(date) = MONTH(CURDATE()) 
      AND YEAR(date) = YEAR(CURDATE())
      AND status = 'present'
    `, [empId]);
    
    // Work hours this month
    const workHoursResult = await query(`
      SELECT SUM(work_hours) as total FROM attendance_records 
      WHERE employee_id = ? 
      AND MONTH(date) = MONTH(CURDATE()) 
      AND YEAR(date) = YEAR(CURDATE())
    `, [empId]);
    
    res.json({
      leaveBalance: balanceResult[0]?.balance || 0,
      pendingRequests: pendingResult[0]?.count || 0,
      attendanceThisMonth: attendanceResult[0]?.count || 0,
      workHoursThisMonth: workHoursResult[0]?.total || 0
    });
  } catch (error) {
    console.error('Employee stats error:', error);
    res.status(500).json({ error: 'Failed to fetch employee stats' });
  }
});

// GET /api/dashboard/pending-approvals - Get items pending admin approval
router.get('/pending-approvals', async (req, res) => {
  try {
    // Pending leave requests
    const pendingLeaves = await query(`
      SELECT lr.*, lt.name as leave_type_name, e.employee_id as emp_code, p.first_name, p.last_name
      FROM leave_requests lr
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE lr.status = 'pending'
      ORDER BY lr.created_at DESC
      LIMIT 10
    `);
    
    // Pending shift exchange requests
    const pendingExchanges = await query(`
      SELECT ser.*, 
             rp.first_name as requester_first_name, rp.last_name as requester_last_name,
             tp.first_name as target_first_name, tp.last_name as target_last_name
      FROM shift_exchange_requests ser
      LEFT JOIN employees re ON ser.requester_id = re.id
      LEFT JOIN profiles rp ON re.user_id = rp.user_id
      LEFT JOIN employees te ON ser.target_employee_id = te.id
      LEFT JOIN profiles tp ON te.user_id = tp.user_id
      WHERE ser.status = 'pending'
      ORDER BY ser.created_at DESC
      LIMIT 10
    `);
    
    // Open helpdesk tickets
    const openTickets = await query(`
      SELECT ht.*, e.employee_id as emp_code, p.first_name, p.last_name
      FROM helpdesk_tickets ht
      LEFT JOIN employees e ON ht.employee_id = e.id
      LEFT JOIN profiles p ON e.user_id = p.user_id
      WHERE ht.status = 'open'
      ORDER BY ht.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      pendingLeaves,
      pendingExchanges,
      openTickets,
      totalPending: pendingLeaves.length + pendingExchanges.length + openTickets.length
    });
  } catch (error) {
    console.error('Pending approvals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

module.exports = router;
