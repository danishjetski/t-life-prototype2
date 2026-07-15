// Mock admin analytics data
export const adminAnalytics = {
    overview: {
        totalStudents: 100,
        activeToday: 18,
        totalEvents: 25,
        avgMatchScore: 84.7,
        totalRSVPs: 907,
        avgAttendanceRate: 62,
    },
    weeklyEngagement: [
        { day: 'Sun', focus: 12, balance: 8 },
        { day: 'Mon', focus: 18, balance: 14 },
        { day: 'Tue', focus: 22, balance: 16 },
        { day: 'Wed', focus: 20, balance: 15 },
        { day: 'Thu', focus: 19, balance: 18 },
        { day: 'Fri', focus: 14, balance: 25 },
        { day: 'Sat', focus: 8, balance: 12 },
    ],
    topEvents: [
        { title: 'Campus Run 5K', rsvps: 145, attendance: 132, rating: 4.6, category: 'balance' },
        { title: 'Imagine Hack: 24-Hour Code Marathon', rsvps: 89, attendance: 76, rating: 4.8, category: 'focus' },
        { title: 'Mental Health Awareness Talk', rsvps: 67, attendance: 54, rating: 4.7, category: 'balance' },
        { title: 'Python Workshop', rsvps: 42, attendance: 38, rating: 4.9, category: 'focus' },
        { title: 'Networking Tea', rsvps: 35, attendance: 31, rating: 4.5, category: 'balance' },
    ],
    categoryBreakdown: [
        { name: 'Technology', count: 5, color: '#3B82F6' },
        { name: 'Career', count: 1, color: '#F59E0B' },
        { name: 'Wellness', count: 0, color: '#10B981' },
        { name: 'Social', count: 0, color: '#8B5CF6' },
        { name: 'Creative', count: 1, color: '#EC4899' },
        { name: 'Academic', count: 0, color: '#6366F1' },
        { name: 'Fitness', count: 1, color: '#10B981' },
        { name: 'Athletics', count: 2, color: '#059669' },
        { name: 'Networking', count: 2, color: '#0EA5E9' },
        { name: 'Entertainment', count: 1, color: '#64748B' },
        { name: 'Community', count: 1, color: '#F59E0B' },
        { name: 'Communication', count: 1, color: '#14B8A6' },
        { name: 'Cloud', count: 1, color: '#2563EB' },
        { name: 'Data Science', count: 1, color: '#0EA5E9' },
        { name: 'Software Engineering', count: 1, color: '#9333EA' },
    ],
    burnoutTelemetry: {
        overallRiskLevel: 'Moderate',
        riskScore: 42, // 0-100
        studentsAtRisk: 18,
        studentsHighRisk: 7,
        focusOnlyStudents: 24, // students who only attend focus events
        avgFocusBalanceRatio: 2.1, // 2.1 focus events per 1 balance
        weeklyTrend: [
            { week: 'W1', risk: 35 },
            { week: 'W2', risk: 38 },
            { week: 'W3', risk: 42 },
            { week: 'W4', risk: 40 },
        ],
        facultyBreakdown: [
            { faculty: 'Computing', risk: 58, students: 28 },
            { faculty: 'Engineering', risk: 52, students: 22 },
            { faculty: 'Business', risk: 35, students: 26 },
            { faculty: 'Design', risk: 28, students: 14 },
            { faculty: 'Hospitality', risk: 22, students: 10 },
        ],
        recommendations: [
            'Schedule more Balance events to reduce focus-only attendance patterns',
            'Computing students show 58% burnout risk — increase wellness initiatives',
            'Friday afternoon is peak wellness slot with 25 attendees — maximize marketing',
            'Consider wellness check-ins for students attending 5+ consecutive focus events',
        ],
    },
    recentActivity: [
        { action: 'New Event Created', detail: 'AWS Cloud Workshop by Cloud Club', time: '2 hours ago', icon: '➕' },
        { action: 'High RSVP Alert', detail: 'Hackathon at 89/120 capacity', time: '3 hours ago', icon: '📊' },
        { action: 'Burnout Alert', detail: '47 students flagged high-risk this week', time: '5 hours ago', icon: '⚠️' },
        { action: 'Event Completed', detail: 'UI/UX Workshop — 4.9★ avg rating', time: '1 day ago', icon: '✅' },
        { action: 'New Merchant', detail: 'Starbucks added 15% student deal', time: '2 days ago', icon: '🏪' },
    ],
};

// Mock admin users for RBAC
export const adminUsers = [
    { id: 'ADMIN-001', name: 'Mr. Danish Irfan', email: 'danish.admin@taylors.edu.my', password: 'danish123', role: 'Super Admin', faculty: 'Computing', avatar: 'D', lastLogin: '2026-03-02T01:30:00' },
    { id: 'ADMIN-002', name: 'Mr. Faisal', email: 'faisal.admin@taylors.edu.my', password: 'admin123', role: 'Event Manager', faculty: 'Student Affairs', avatar: 'F', lastLogin: '2026-03-01T18:45:00' },
    { id: 'ADMIN-003', name: 'Ms. Felzha', email: 'felzha.admin@taylors.edu.my', password: 'admin123', role: 'Event Manager', faculty: 'Computing', avatar: 'F', lastLogin: '2026-03-01T14:20:00' },
];

// RBAC role definitions
export const roles = {
    'Super Admin': { canCreate: true, canEdit: true, canDelete: true, canViewAnalytics: true, canManageUsers: true, canViewBurnout: true },
    'Event Manager': { canCreate: true, canEdit: true, canDelete: false, canViewAnalytics: true, canManageUsers: false, canViewBurnout: false },
    'Analytics Viewer': { canCreate: false, canEdit: false, canDelete: false, canViewAnalytics: true, canManageUsers: false, canViewBurnout: true },
};
