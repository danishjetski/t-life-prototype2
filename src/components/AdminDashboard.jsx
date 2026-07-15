// This is the src/components/AdminDashboard.jsx file
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, memo } from "react";
import { supabase } from "./GoogleLogin";
import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Shield,
  Activity,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Star,
  Zap,
} from "lucide-react";
import { adminAnalytics, roles } from "../data/admin";
import { events } from "../data/events";
import { getAdmins, createAdmin } from "../data/db";
import AdminAIWellnessWidget from "./AdminAIWellnessWidget";
import {
  initializeDB,
  getAllEvents,
  addEvent,
  updateEvent,
  deleteEvent,
  seedEventsIfEmpty,
} from "../data/eventdb";
const emptyEvent = {
  title: "",
  host: "",
  date: "",
  time: "",
  location: "",
  category: "focus",
  capacity: 50,
  description: "",
  zone: "Block D",
  tag: "Technology",
  emoji: "📚",
  registered: 0,
};

const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const MOCK_TOTAL_STUDENTS = 100; // Realistic baseline for campus
const MOCK_ACTIVE_TODAY = 18; // Active students today

// Realistic baseline students per Faculty
const MOCK_FACULTY_STUDENTS = {
  Computing: 28,
  Engineering: 22,
  Business: 26,
  Design: 14,
  Hospitality: 10,
};

const toSupabaseRow = (event, creator = null) => ({
  title: event.title,
  host: event.host,
  event_date: event.date || null,
  event_time: event.time || null,
  location: event.location || null,
  zone: event.zone || null,
  category: event.category || "focus",
  capacity: Number(event.capacity) || 0,
  registered: Number(event.registered) || 0,
  description: event.description || null,
  tag: event.tag || "Technology",
  emoji: event.emoji || "📚",
  ...(creator && {
    created_by_id: creator.id,
    created_by_name: creator.name,
    created_by_role: creator.role,
  }),
});

const fromSupabaseEvent = (row) => ({
  id: row.id,
  title: row.title,
  host: row.host,
  time: row.event_time || "",
  date: row.event_date || "",
  location: row.location || "",
  zone: row.zone || "",
  category: row.category || "focus",
  match_score: row.match_score || "—",
  match_breakdown: row.match_breakdown || {},
  friends_attending: row.friends_attending || 0,
  friendNames: row.friend_names || [],
  description: row.description || "",
  icon: row.icon || "CalendarIcon",
  accent: row.accent || "#E31837",
  tag: row.tag || "General",
  emoji: row.emoji || "📚",
  tgcTags: row.tgc_tags || [],
  shineTags: row.shine_tags || [],
  capacity: row.capacity || 0,
  registered: row.registered || 0,
  isRSVPd: row.is_rsvpd || false,
  accessibility: row.accessibility || [],
  createdById: row.created_by_id || "",
  createdByName: row.created_by_name || "",
  createdByRole: row.created_by_role || "",
  createdAt: row.created_at || "",
  updatedAt: row.updated_at || row.created_at || "",
});

const sortNewestFirst = (list) =>
  [...list].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) -
      new Date(a.updatedAt || a.createdAt || 0),
  );

// Simple bar chart component
function MiniBarChart({ data, dataKeyA, dataKeyB, labelKey, height = 120 }) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d[dataKeyA], d[dataKeyB])),
  );

  return (
    // New: Added gap between Y-axis and bars, and adjusted height to account for X-axis labels
    <div className="flex gap-2" style={{ height }}>
      <div
        className="flex flex-col justify-between items-end pr-1 text-[8px] font-inter text-gray-500"
        style={{ height: height - 20, minWidth: 24 }}
      >
        {[
          maxVal,
          Math.round(maxVal * 0.75),
          Math.round(maxVal * 0.5),
          Math.round(maxVal * 0.25),
          0,
        ].map((tick, index) => (
          <span key={`y-tick-${tick}-${index}`}>{tick}</span>
        ))}
      </div>

      <div className="flex-1 flex items-end justify-between gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="flex items-end gap-px w-full justify-center"
              style={{ height: height - 20 }}
            >
              <motion.div
                className="flex-1 max-w-[12px] rounded-t bg-taylor-red/80"
                initial={{ height: 0 }}
                animate={{
                  height: `${maxVal ? (d[dataKeyA] / maxVal) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
              <motion.div
                className="flex-1 max-w-[12px] rounded-t bg-balance-accent/80"
                initial={{ height: 0 }}
                animate={{
                  height: `${maxVal ? (d[dataKeyB] / maxVal) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
              />
            </div>

            <span className="text-[8px] font-inter text-gray-500">
              {d[labelKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ icon: Icon, label, value, change, changeType, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        {change && (
          <span
            className={`text-[10px] font-inter font-bold flex items-center gap-0.5 ${changeType === "up" ? "text-green-400" : "text-red-400"}`}
          >
            {changeType === "up" ? (
              <ArrowUpRight size={10} />
            ) : (
              <ArrowDownRight size={10} />
            )}
            {change}
          </span>
        )}
      </div>
      <p className="text-xs font-outfit font-bold text-white">{value}</p>
      <p className="text-[10px] font-inter text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

// Event CRUD row - memoized for performance
const EventRow = memo(function EventRow({ event, onEdit, onDelete, canDelete }) {
  const capacityPercent = Math.round((event.registered / event.capacity) * 100);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass mb-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm">{event.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-outfit font-semibold text-white truncate">
            {event.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-inter text-gray-500">
              {event.host}
            </span>
            <span
              className={`text-[9px] font-inter font-bold px-1.5 py-0.5 rounded ${event.category === "focus" ? "bg-taylor-red/10 text-taylor-red" : "bg-balance-accent/10 text-balance-accent"}`}
            >
              {event.category}
            </span>
            <span
              className={`text-[9px] font-inter ${capacityPercent > 80 ? "text-yellow-400" : "text-gray-500"}`}
            >
              {event.registered}/{event.capacity}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={() => onEdit(event)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Edit3 size={13} className="text-gray-400" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(event.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
});

export default function AdminDashboard({ onBack, userRole, displayName }) {
  // If they logged in as super_admin, default to Danish (index 0). Otherwise Faisal (index 1).
  const [activeSection, setActiveSection] = useState("overview"); // overview | events | burnout | access

  // User Management State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [localAdminUsers] = useState(getAdmins());
  const [supabaseAdminUsers, setSupabaseAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Event Manager",
    faculty: "Computing",
  });

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalMode, setEventModalMode] = useState("create");
  const [eventDraft, setEventDraft] = useState(emptyEvent);
  const [adminEvents, setAdminEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const roleDisplayNames = {
    super_admin: "Super Admin",
    admin: "Event Manager",
    analytics_viewer: "Analytics Viewer",
  };

  const normalizedUserRole = String(userRole || "admin")
    .trim()
    .toLowerCase();

  const permissionRole =
    normalizedUserRole === "super_admin"
      ? "Super Admin"
      : normalizedUserRole === "analytics_viewer"
        ? "Analytics Viewer"
        : "Event Manager";

  const currentAdmin =
    localAdminUsers.find((admin) => {
      const adminRole = String(admin.role || "")
        .trim()
        .toLowerCase();

      if (normalizedUserRole === "super_admin") {
        return adminRole === "super admin" || adminRole === "super_admin";
      }

      if (normalizedUserRole === "analytics_viewer") {
        return (
          adminRole === "analytics viewer" || adminRole === "analytics_viewer"
        );
      }

      return adminRole === "event manager" || adminRole === "admin";
    }) || null;

  const loggedInAdmin = {
    id: currentAdmin?.id || null,
    name:
      displayName ||
      currentAdmin?.full_name ||
      currentAdmin?.name ||
      "Administrator",
    role: roleDisplayNames[normalizedUserRole] || "Event Manager",
    dbRole: normalizedUserRole,
    faculty: currentAdmin?.faculty || "",
    avatar:
      displayName?.charAt(0)?.toUpperCase() || currentAdmin?.avatar || "A",
  };

  const permissions = roles[permissionRole] || {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canViewAnalytics: false,
    canManageUsers: false,
    canViewBurnout: false,
  };
  // New: State for recent activities
  const [recentActivities, setRecentActivities] = useState(
    adminAnalytics.recentActivity,
  );
  const [attendance, setAttendance] = useState([]);

  // New: State for total students count
  const [totalStudents, setTotalStudents] = useState(MOCK_TOTAL_STUDENTS);

  // New: State for active students today
  const [activeToday, setActiveToday] = useState(MOCK_ACTIVE_TODAY);

  // New: State for burnout analytics
  const [burnoutAnalytics, setBurnoutAnalytics] = useState({
    ...adminAnalytics.burnoutTelemetry,
    weeklyTrend: [],
  });

  // New: Map activity types to icons and styles
  const activityIcons = {
    create: Plus,
    update: Edit3,
    delete: Trash2,
  };

  const activityStyles = {
    create: "bg-green-500/15 text-green-400",
    update: "bg-blue-500/15 text-blue-400",
    delete: "bg-red-500/15 text-red-400",
  };

  const analytics = adminAnalytics;

  // Calculate average match score from actual events
  const avgMatchScore = useMemo(() => {
    if (adminEvents.length === 0) return 84.7;
    const scores = adminEvents
      .map((evt) => {
        const scoreStr = String(evt.match_score || "0").replace("%", "");
        return parseFloat(scoreStr) || 0;
      })
      .filter((score) => score > 0);

    if (scores.length === 0) return 84.7;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg * 10) / 10;
  }, [adminEvents]);

  // New: Calculate weekly engagement based on attendance data
  const calculateWeeklyEngagement = (attendanceRecords, eventsList) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const result = days.map((day) => ({
      day,
      focus: 0,
      balance: 0,
    }));

    attendanceRecords.forEach((record) => {
      const event = eventsList.find((e) => e.id === record.event_id);
      if (!event) return;

      const index = new Date(record.attended_at).getDay();

      if (event.category === "focus") {
        result[index].focus++;
      } else {
        result[index].balance++;
      }
    });

    return result;
  };

  const weeklyEngagement =
    attendance.length > 0 
      ? calculateWeeklyEngagement(attendance, adminEvents)
      : analytics.weeklyEngagement;

  // New: Load attendance data
  const loadAttendance = async () => {
    if (!hasSupabaseConfig) {
      setAttendance([]);
      return;
    }

    const { data, error } = await supabase.from("attendance").select("*");

    if (error) {
      console.error("Failed to load attendance:", error.message);
      setAttendance([]);
      return;
    }

    setAttendance(data || []);
  };

  // New: Load total students count from Supabase
  const loadTotalStudents = async () => {
    if (!hasSupabaseConfig) {
      setTotalStudents(MOCK_TOTAL_STUDENTS);
      return;
    }

    const { count, error } = await supabase
      .from("student_profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Failed to load total students:", error.message);
      setTotalStudents(MOCK_TOTAL_STUDENTS);
      return;
    }

    setTotalStudents(MOCK_TOTAL_STUDENTS + (count ?? 0));
  };

  // New: Load active students today from Supabase and add fake baseline
  const loadActiveToday = async () => {
    if (!hasSupabaseConfig) {
      setActiveToday(MOCK_ACTIVE_TODAY);
      return;
    }

    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ).toISOString();

    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    ).toISOString();

    const { count, error } = await supabase
      .from("student_profiles")
      .select("*", { count: "exact", head: true })
      .gte("last_active_at", startOfToday)
      .lt("last_active_at", startOfTomorrow);

    if (error) {
      console.error("Failed to load active students today:", error.message);
      setActiveToday(MOCK_ACTIVE_TODAY);
      return;
    }

    setActiveToday(MOCK_ACTIVE_TODAY + (count ?? 0));
  };

  // New: Load burnout analytics from Supabase
  const loadBurnoutAnalytics = async () => {
    if (!hasSupabaseConfig) {
      setBurnoutAnalytics({
        ...analytics.burnoutTelemetry,
        riskScore: campusRiskScore,
        overallRiskLevel:
          campusRiskScore >= 60
            ? "High"
            : campusRiskScore >= 35
              ? "Medium"
              : "Low",
        studentsAtRisk,
        studentsHighRisk,
        focusBalanceRatio,
        weeklyTrend:
          weeklyTrend.length > 0
            ? weeklyTrend
            : analytics.burnoutTelemetry.weeklyTrend,
        facultyBreakdown,
        recommendations: recommendationList,
      });
      return;
    }

    // 1. Calculate Focus : Balance ratio
    let focusBalanceRatio = "0.0";

    const { data: modeRows, error: modeError } = await supabase
      .from("student_profiles")
      .select("focus_mode");

    if (modeError) {
      console.error("Failed to load preferred modes:", modeError.message);
    } else {
      const focusCount =
        modeRows?.filter(
          (student) => String(student.focus_mode).toLowerCase() === "focus",
        ).length || 0;

      const balanceCount =
        modeRows?.filter(
          (student) => String(student.focus_mode).toLowerCase() === "balance",
        ).length || 0;

      focusBalanceRatio =
        balanceCount > 0
          ? (focusCount / balanceCount).toFixed(1)
          : focusCount > 0
            ? focusCount.toFixed(1)
            : "0.0";
    }

    // 2. Then load burnout risk scores
    const { data: scores, error: scoresError } = await supabase
      .from("burnout_risk_scores")
      .select(
        `
      student_id,
      risk_score,
      risk_level,
      week_start,
      student_profiles (
        faculty
      )
  `,
      )
      .order("week_start", { ascending: false });

    // 3. Then load wellness recommendations
    let recommendationList = analytics.burnoutTelemetry.recommendations;

    const { data: recommendations, error: recommendationsError } =
      await supabase
        .from("wellness_recommendations")
        .select("recommendation")
        .order("created_at", { ascending: false })
        .limit(5);

    if (!recommendationsError && recommendations?.length > 0) {
      recommendationList = recommendations.map((item) => item.recommendation);
    }

    if (scoresError) {
      console.error("Failed to load burnout analytics:", scoresError.message);
      setBurnoutAnalytics({
        ...analytics.burnoutTelemetry,
        focusBalanceRatio,
        recommendations: recommendationList,
      });
      return;
    }

    // New: Handle case where no scores are found
    if (!scores || scores.length === 0) {
      console.log("No burnout risk scores found.");
      setBurnoutAnalytics((prev) => ({
        ...prev,
        riskScore: 0,
        overallRiskLevel: "Low",
        studentsAtRisk: 0,
        studentsHighRisk: 0,
        focusBalanceRatio,
        weeklyTrend: [],
        facultyBreakdown: [],
        recommendations: recommendationList,
      }));
      return;
    }

    const joinedScores = scores.filter((item) => item.student_profiles);

    const latestWeekStart = joinedScores.reduce((latest, item) => {
      if (!item.week_start) return latest;

      if (!latest || item.week_start > latest) {
        return item.week_start;
      }

      return latest;
    }, null);

    // Use only the newest week's records for dashboard totals.
    const validScores = latestWeekStart
      ? joinedScores.filter((item) => item.week_start === latestWeekStart)
      : [];

    // Current campus risk score uses only the newest week's records
    const campusRiskScore =
      validScores.length > 0
        ? Math.round(
            validScores.reduce(
              (sum, item) => sum + Number(item.risk_score || 0),
              0,
            ) / validScores.length,
          )
        : 0;

    // Four-week trend uses all available weeks from Supabase
    const weekMap = {};

    joinedScores.forEach((item) => {
      const weekStart = item.week_start;

      if (!weekStart) return;

      if (!weekMap[weekStart]) {
        weekMap[weekStart] = {
          weekStart,
          totalRisk: 0,
          count: 0,
        };
      }

      weekMap[weekStart].totalRisk += Number(item.risk_score || 0);
      weekMap[weekStart].count += 1;
    });

    const weeklyTrend = Object.values(weekMap)
      .sort((a, b) => new Date(a.weekStart) - new Date(b.weekStart))
      .slice(-4)
      .map((item, index, selectedWeeks) => ({
        week: `W${index + 1}`,
        date: new Date(item.weekStart).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        risk: item.count > 0 ? Math.round(item.totalRisk / item.count) : 0,
      }));

    const atRiskStudentIds = new Set(
      validScores
        .filter((item) => {
          const level = String(item.risk_level || "")
            .trim()
            .toLowerCase();

          return level === "medium" || level === "high";
        })
        .map((item) => item.student_id),
    );

    const highRiskStudentIds = new Set(
      validScores
        .filter((item) => {
          const level = String(item.risk_level || "")
            .trim()
            .toLowerCase();

          return level === "high";
        })
        .map((item) => item.student_id),
    );

    const studentsAtRisk = atRiskStudentIds.size;
    const studentsHighRisk = highRiskStudentIds.size;

    const facultyMap = {};

    validScores.forEach((item) => {
      const faculty = item.student_profiles.faculty || "Unknown";

      if (!facultyMap[faculty]) {
        facultyMap[faculty] = {
          faculty,
          students: 0,
          totalRisk: 0,
        };
      }

      facultyMap[faculty].students += 1;
      facultyMap[faculty].totalRisk += Number(item.risk_score || 0);
    });

    // Combine fake faculty baseline with real Supabase burnout data
    const facultyBreakdown = Object.entries(MOCK_FACULTY_STUDENTS).map(
      ([faculty, baselineStudents]) => {
        const realFacultyData = facultyMap[faculty];

        return {
          faculty,

          // Fake baseline + real opted-in students from Supabase
          students: baselineStudents + (realFacultyData?.students || 0),

          // Use real calculated risk when available
          // Otherwise fall back to mock risk data
          risk: realFacultyData?.students
            ? Math.round(realFacultyData.totalRisk / realFacultyData.students)
            : analytics.burnoutTelemetry.facultyBreakdown.find(
                (item) => item.faculty === faculty,
              )?.risk || 0,
        };
      },
    );

    setBurnoutAnalytics({
      ...analytics.burnoutTelemetry,
      riskScore: campusRiskScore,
      overallRiskLevel:
        campusRiskScore >= 60
          ? "High"
          : campusRiskScore >= 35
            ? "Medium"
            : "Low",
      studentsAtRisk,
      studentsHighRisk,
      focusBalanceRatio,
      weeklyTrend:
        weeklyTrend.length > 0
          ? weeklyTrend
          : analytics.burnoutTelemetry.weeklyTrend,
      facultyBreakdown,
      recommendations: recommendationList,
    });
  };

  // New: Calculate total RSVPs and attendance rate
  const totalRSVPs = adminEvents.reduce(
    (sum, event) => sum + Number(event.registered || 0),
    0,
  );

  // New: Calculate total capacity and attendance rate
  const totalCapacity = adminEvents.reduce(
    (sum, event) => sum + Number(event.capacity || 0),
    0,
  );

  // New: Calculate attendance rate as a percentage
  const attendanceRate =
    totalCapacity > 0 ? Math.round((totalRSVPs / totalCapacity) * 100) : 0;

  // New: Sort events by registered count to get top events
  const topEventsSource = adminEvents.length > 0 ? adminEvents : events;

  const topEvents = [...topEventsSource]
    .sort(
      (a, b) =>
        Number(b.registered || b.rsvps || 0) -
        Number(a.registered || a.rsvps || 0),
    )
    .slice(0, 5);

  // Fetch admin users from Supabase
  const fetchSupabaseAdminUsers = async () => {
    setAdminUsersLoading(true);

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, full_name, email, role, faculty, avatar, last_login, created_at",
        )
        .in("role", ["admin", "super_admin", "analytics_viewer"])
        .order("created_at", { ascending: true });

      if (error) throw error;

      setSupabaseAdminUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch admin users:", err.message);
      setSupabaseAdminUsers([]);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const loadSupabaseEvents = async () => {
    setEventsLoading(true);
    setEventsError("");

    try {
      // Load from local database first (instant, no delays)
      const localEvents = getAllEvents();
      
      if (localEvents.length > 0) {
        // Use local database events
        setAdminEvents(sortNewestFirst(localEvents));
        setIsSupabaseOnline(false);
        setEventsLoading(false);
        return;
      }

      // Local database is empty - seed with initial mock data
      const seeded = seedEventsIfEmpty(events);
      if (seeded) {
        const dbEvents = getAllEvents();
        setAdminEvents(sortNewestFirst(dbEvents));
        setEventsLoading(false);
        return;
      }

      // Fallback to mock events
      setAdminEvents(sortNewestFirst(events));
      setEventsLoading(false);
    } catch (err) {
      console.error("Failed to load events:", err);
      setEventsError("Error loading events. Using demo data.");
      setAdminEvents(sortNewestFirst(events));
      setEventsLoading(false);
    }
  };

  // New: Fetch recent activity logs from Supabase
  const fetchRecentActivity = async (admin = currentAdmin) => {
    if (!hasSupabaseConfig || !admin) {
      setRecentActivities([]);
      return;
    }

    let query = supabase.from("activity_logs").select("*");

    // Super Admin sees everything
    const adminRole = String(admin.dbRole || admin.role || "").toLowerCase();

    if (adminRole !== "super_admin" && adminRole !== "super admin") {
      query = query.eq("performed_by_id", admin.id);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      setRecentActivities([]);
      return;
    }

    setRecentActivities(
      (data || []).map((log) => ({
        type: log.action,
        action:
          log.action === "create"
            ? "Event Created"
            : log.action === "update"
              ? "Event Updated"
              : "Event Deleted",
        detail: `${log.event_title} • ${log.event_host || "Unknown host"}`,
        time: new Date(log.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    );
  };

  // Initial load on mount - load all data instantly
  useEffect(() => {
    // Initialize local database
    initializeDB();
    
    // Load all data immediately on mount (no delays, no async waiting)
    loadSupabaseEvents();
    fetchSupabaseAdminUsers();
    loadAttendance();
    loadBurnoutAnalytics();
    loadTotalStudents();
    loadActiveToday();
  }, []);

  // Load section-specific data when section changes
  useEffect(() => {
    if (activeSection === "access") {
      fetchSupabaseAdminUsers();
    }

    if (activeSection === "burnout") {
      loadBurnoutAnalytics();
    }

    if (activeSection === "overview") {
      fetchRecentActivity(loggedInAdmin);
    }

    // Don't refetch events section if data already loaded
    if (activeSection === "events" && adminEvents.length === 0) {
      loadSupabaseEvents();
    }
  }, [activeSection, loggedInAdmin, adminEvents.length]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === "all") return adminEvents;
    return adminEvents.filter((event) => event.category === eventFilter);
  }, [adminEvents, eventFilter]);

  const updateEventDraft = (patch) => {
    setEventDraft((prev) => ({ ...prev, ...patch }));
  };

  const openCreateEvent = () => {
    setEventModalMode("create");
    setEventDraft({ ...emptyEvent });
    setEventsError("");
    setShowEventModal(true);
  };

  const openEditEvent = (event) => {
    setEventModalMode("edit");
    setEventDraft({ ...event });
    setEventsError("");
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventDraft.title.trim() || !eventDraft.host.trim()) {
      alert("Please fill in Event Title and Host.");
      return;
    }

    const eventToSave = {
      ...eventDraft,
      id: eventDraft.id || `EVT-${Date.now()}`,
    };

    const newEvent = {
      ...eventToSave,
      match_score: "85%",
      match_breakdown: { interest: 85, schedule: 85, proximity: 85, social: 85 },
      friends_attending: 0,
      friendNames: [],
      icon: "CalendarIcon",
      accent: eventToSave.category === "focus" ? "#E21836" : "#00BFA5",
      tgcTags: [],
      shineTags: [],
      isRSVPd: false,
      accessibility: ["wifi"],
      createdById: loggedInAdmin?.id || "admin-001",
      createdByName: loggedInAdmin?.name || "Administrator",
      createdByRole: loggedInAdmin?.dbRole || "admin",
      createdAt: eventToSave.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save to local database IMMEDIATELY
      if (eventModalMode === "edit") {
        updateEvent(newEvent.id, newEvent);
      } else {
        addEvent(newEvent);
      }

      // Update UI immediately (no loading delay)
      setAdminEvents((prev) =>
        sortNewestFirst(
          eventModalMode === "edit"
            ? prev.map((e) => (e.id === newEvent.id ? newEvent : e))
            : [newEvent, ...prev],
        ),
      );

      setShowEventModal(false);
      setEventDraft(emptyEvent);
      alert(
        eventModalMode === "edit"
          ? "Event updated successfully!"
          : "Event created successfully!",
      );

      // Try to sync to Supabase in background (non-blocking)
      if (hasSupabaseConfig) {
        setTimeout(async () => {
          try {
            const now = new Date().toISOString();
            const supabasePayload = {
              id: newEvent.id,
              ...toSupabaseRow(
                newEvent,
                eventModalMode === "create" ? loggedInAdmin : null,
              ),
              created_at: eventModalMode === "create" ? now : undefined,
              updated_at: now,
            };

            if (eventModalMode === "edit") {
              await supabase
                .from("campus_events")
                .update(supabasePayload)
                .eq("id", newEvent.id);
            } else {
              await supabase
                .from("campus_events")
                .insert(supabasePayload);
            }
          } catch (err) {
            console.warn("Background Supabase sync failed (local db is primary):", err);
          }
        }, 100); // Non-blocking background sync
      }
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;

    try {
      // Delete from local database IMMEDIATELY
      deleteEvent(id);

      // Update UI instantly (no loading delay)
      setAdminEvents((prev) => sortNewestFirst(prev.filter((e) => e.id !== id)));

      // Try to sync deletion with Supabase in background (non-blocking)
      if (hasSupabaseConfig) {
        setTimeout(async () => {
          try {
            await supabase
              .from("campus_events")
              .delete()
              .eq("id", id);
          } catch (err) {
            console.warn("Background Supabase deletion failed (local db is primary):", err);
          }
        }, 100); // Non-blocking background sync
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event: " + err.message);
    }
  };

  // New: Handle creating a new admin user
  const handleCreateUser = async () => {
    const fullName = newUser.name.trim();
    const email = newUser.email.trim().toLowerCase();
    const password = newUser.password.trim();
    const faculty = newUser.faculty;

    if (!fullName || !email || !password) {
      alert("Please fill in Full Name, Email, and Password.");
      return;
    }

    if (!email.endsWith("@taylors.edu.my")) {
      alert("Please use a valid Taylor's staff email.");
      return;
    }

    if (!hasSupabaseConfig) {
      alert("Supabase is not configured.");
      return;
    }

    const roleMap = {
      "Event Manager": "admin",
      "Analytics Viewer": "analytics_viewer",
      "Super Admin": "super_admin",
    };

    const dbRole = roleMap[newUser.role] || "admin";

    try {
      const { data: existingAdmin, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAdmin) {
        alert("This admin email already exists.");
        return;
      }

      let userId = crypto.randomUUID();
      let createdViaAuth = false;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: dbRole,
            account_type: "admin",
          },
        },
      });

      if (!authError && authData.user?.id) {
        userId = authData.user.id;
        createdViaAuth = true;
      }

      const isRateLimit =
        authError?.message?.toLowerCase().includes("rate") ||
        authError?.message?.toLowerCase().includes("too many") ||
        authError?.status === 429;

      if (authError && !isRateLimit) {
        throw authError;
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        full_name: fullName,
        email,
        role: dbRole,
        faculty,
        avatar: fullName.charAt(0).toUpperCase(),
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await fetchSupabaseAdminUsers();

      alert(
        createdViaAuth
          ? `${newUser.role} account created successfully.`
          : `${newUser.role} saved to Admin Users. Auth was skipped due to rate limit.`,
      );

      setShowCreateUserModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "Event Manager",
        faculty: "Computing",
      });
    } catch (err) {
      console.error("Failed to create admin account:", err);
      alert(err.message || "Failed to create admin account.");
    }
  };

  const sections = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "events", icon: Calendar, label: "Events" },
    ...(permissions.canViewBurnout
      ? [{ id: "burnout", icon: Activity, label: "Burnout" }]
      : []),
    ...(permissions.canManageUsers
      ? [{ id: "access", icon: Shield, label: "Access" }]
      : []),
  ];

  const eventCategoryCounts = useMemo(() => {
    return [
      "Technology",
      "Career",
      "Wellness",
      "Social",
      "Creative",
      "Academic",
      "Fitness",
      "Athletics",
      "Networking",
      "Entertainment",
      "Community",
      "Communication",
      "Cloud",
      "Data Science",
      "Software Engineering",
    ].map((name) => {
      const count = adminEvents.filter((event) => event.tag === name).length;
      const categoryMatch = analytics.categoryBreakdown.find(
        (cat) => cat.name === name
      );
      return {
        name,
        count,
        color: categoryMatch?.color || "#6B7280",
      };
    }).filter(cat => cat.count > 0);
  }, [adminEvents]);

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Admin Header */}
      <div className="sticky top-0 z-50 bg-[#050508]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[900px] mx-auto px-5 pt-4 pb-2">
          {/* Top row: close button + title + avatar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
              <div>
                <h1 className="text-base font-outfit font-bold text-white">
                  Admin Dashboard
                  <span className="text-[9px] font-inter font-medium bg-taylor-red/20 text-taylor-red px-2 py-0.5 rounded-full border border-taylor-red/30 whitespace-nowrap">
                    {loggedInAdmin.role}
                  </span>
                </h1>

                <p className="text-[10px] font-inter text-gray-500">
                  Welcome, {loggedInAdmin.name}
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-taylor-red to-taylor-red-dark flex items-center justify-center text-sm font-bold shadow-glow-red">
              {loggedInAdmin.avatar}
            </div>
          </div>

          {/* Admin Switcher Row 
          <div className="flex items-center gap-2 ml-11">
            <span className="text-[9px] font-inter font-medium bg-taylor-red/20 text-taylor-red px-2 py-0.5 rounded-full border border-taylor-red/30 whitespace-nowrap">
              {currentAdmin.role}
            </span>
            <select
              value={adminUserIndex}
              onChange={(e) => {
                // New: Update the selected admin user and reset to overview section
                const index = Number(e.target.value);
                const selectedAdmin = localAdminUsers[index];

                setAdminUserIndex(index);
                setActiveSection("overview");

                fetchRecentActivity(selectedAdmin);
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-inter text-gray-300 focus:outline-none focus:border-taylor-red/50 cursor-pointer"
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
            >
              {localAdminUsers.map((u, i) => (
                <option
                  key={u.id}
                  value={i}
                  className="bg-[#12121a] text-white"
                >
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Section Tabs */}
        <div className="max-w-[900px] mx-auto px-5 pb-3 flex gap-2">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-outfit font-semibold transition-all duration-300 ${
                activeSection === sec.id
                  ? "bg-taylor-red/20 text-taylor-red border border-taylor-red/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <sec.icon size={14} />
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* OVERVIEW SECTION */}
          {activeSection === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <StatCard
                  icon={Users}
                  label="Total Students"
                  value={totalStudents.toLocaleString()}
                  change={totalStudents > 95 ? "+5%" : totalStudents > 85 ? "+3%" : "—"}
                  changeType="up"
                  color="#3B82F6"
                />
                <StatCard
                  icon={Zap}
                  label="Active Today"
                  value={activeToday.toLocaleString()}
                  change={activeToday > 15 ? "+8%" : activeToday > 10 ? "+4%" : "—"}
                  changeType="up"
                  color="#10B981"
                />
                <StatCard
                  icon={Calendar}
                  label="Total Events"
                  value={adminEvents.length}
                  change={adminEvents.length > 20 ? "+8" : adminEvents.length > 15 ? "+5" : "—"}
                  changeType={adminEvents.length > 20 ? "up" : "down"}
                  color="#F59E0B"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Match Score"
                  value={`${avgMatchScore}%`}
                  change={adminEvents.length > 0 ? "Live" : "—"}
                  changeType="up"
                  color="#8B5CF6"
                />
                <StatCard
                  icon={Star}
                  label="Total RSVPs"
                  value={totalRSVPs.toLocaleString()}
                  change={totalRSVPs > 850 ? "+15%" : totalRSVPs > 700 ? "+8%" : "—"}
                  changeType="up"
                  color="#EC4899"
                />
                <StatCard
                  icon={Activity}
                  label="Attendance Rate"
                  value={`${attendanceRate}%`}
                  change={attendanceRate > 60 ? "Healthy" : attendanceRate > 45 ? "Moderate" : "Low"}
                  changeType={attendanceRate > 60 ? "up" : "down"}
                  color="#EF4444"
                />
              </div>

              {/* Weekly Engagement Chart */}
              <div className="glass rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-outfit font-bold text-white">
                    Weekly Engagement
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[9px] font-inter text-gray-400">
                      <span className="w-2 h-2 rounded-sm bg-taylor-red/80"></span>{" "}
                      Focus
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-inter text-gray-400">
                      <span className="w-2 h-2 rounded-sm bg-balance-accent/80"></span>{" "}
                      Balance
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  {/* Y Axis */}
                  <div
                    className="text-[10px] font-inter text-gray-500 mr-3"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    Students
                  </div>

                  <div className="flex-1">
                    <MiniBarChart
                      data={weeklyEngagement}
                      dataKeyA="focus"
                      dataKeyB="balance"
                      labelKey="day"
                      height={140}
                    />

                    {/* X Axis */}
                    <div className="text-center mt-2 text-[10px] font-inter text-gray-500">
                      Day of Week
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Events + Category Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Top Events */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-outfit font-semibold text-white mb-3">
                    Top Events This Month
                  </h3>
                  <div className="space-y-2">
                    {topEvents.map((evt, i) => {
                      const fillRate =
                        Number(evt.capacity || 0) > 0
                          ? Math.round(
                              (Number(evt.registered || 0) /
                                Number(evt.capacity || 0)) *
                                100,
                            )
                          : 0;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]"
                        >
                          {/* New: Event number and title */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-gray-600 w-4">
                              #{i + 1}
                            </span>
                            <p className="text-[11px] font-inter text-white truncate">
                              {evt.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-[10px] font-inter text-yellow-400">
                              {fillRate}%
                            </span>
                            <span className="text-[10px] font-inter text-gray-500">
                              {evt.registered}/{evt.capacity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-xs font-outfit font-semibold text-white mb-3">
                    Event Categories
                  </h3>
                  <div className="space-y-2.5">
                    {eventCategoryCounts.map(
                      (
                        cat, // change to eventCategoryCounts
                      ) => (
                        <div key={cat.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-inter text-gray-400">
                              {cat.name}
                            </span>
                            <span
                              className="text-[11px] font-inter font-bold"
                              style={{ color: cat.color }}
                            >
                              {cat.count}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(cat.count / 50) * 100}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="glass rounded-2xl p-5">
                <h3 className="text-xs font-outfit font-semibold text-white mb-3">
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {/* New: Render recent activities dynamically */}
                  {recentActivities.length === 0 ? (
                  <p className="text-[10px] font-inter text-gray-500">
                    No recent activity yet.
                  </p>
                  ) : (
                    recentActivities.map((act, i) => {
                      const type = act.type || "create";
                      const Icon = activityIcons[type] || Calendar;
                      const iconStyle =
                        activityStyles[type] || "bg-white/10 text-gray-400";

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02]"
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconStyle}`}
                          >
                            <Icon size={18} />
                          </div>

                          <div className="flex-1">
                            <p className="text-[10px] font-outfit font-semibold text-white">
                              {act.action}
                            </p>
                            <p className="text-[10px] font-inter text-gray-500">
                              {act.detail}
                            </p>
                          </div>

                          <span className="text-[9px] font-inter text-gray-600">
                            {act.time}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* EVENTS CRUD SECTION */}
          {activeSection === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-outfit font-bold text-white">
                  Event Management{" "}
                  <span className="text-sm font-normal text-gray-500">
                    ({adminEvents.length})
                  </span>
                </h2>
                {permissions.canCreate && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={openCreateEvent}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-taylor-red to-taylor-red-light text-white text-xs font-outfit font-semibold shadow-glow-red"
                  >
                    <Plus size={14} /> New Event
                  </motion.button>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mb-4">
                {[
                  { label: "All", value: "all" },
                  { label: "Focus", value: "focus" },
                  { label: "Balance", value: "balance" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setEventFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-outfit font-semibold transition-colors ${
                      eventFilter === filter.value
                        ? "bg-taylor-red/20 text-taylor-red border border-taylor-red/30"
                        : "text-gray-400 glass hover:text-white"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Events List */}
              <div>
                {filteredEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onEdit={openEditEvent}
                    onDelete={handleDelete}
                    canDelete={permissions.canDelete}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* BURNOUT TELEMETRY SECTION */}
          {activeSection === "burnout" && (
            <motion.div
              key="burnout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle size={20} className="text-yellow-400" />
                <div>
                  <h2 className="text-lg font-outfit font-bold text-white">
                    Predictive Burnout Telemetry
                  </h2>
                  <p className="text-[10px] font-inter text-gray-500">
                    Anonymized, aggregated campus wellness analytics
                  </p>
                </div>
              </div>

              {/* Risk Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-lg font-outfit font-bold text-yellow-400">
                    {burnoutAnalytics.riskScore}%
                  </p>
                  <p className="text-[10px] font-inter text-gray-500">
                    Campus Risk Score
                  </p>
                  <p
                    className={`text-[9px] font-inter font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${
                      burnoutAnalytics.riskScore > 50
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {burnoutAnalytics.overallRiskLevel}
                  </p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-lg font-outfit font-bold text-orange-400">
                    {burnoutAnalytics.studentsAtRisk}
                  </p>
                  <p className="text-[10px] font-inter text-gray-500">
                    At-Risk Students
                  </p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-lg font-outfit font-bold text-red-400">
                    {burnoutAnalytics.studentsHighRisk}
                  </p>
                  <p className="text-[10px] font-inter text-gray-500">
                    High-Risk Students
                  </p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-lg font-outfit font-bold text-blue-400">
                    {burnoutAnalytics.focusBalanceRatio ?? "0.0"}:1
                  </p>
                  <p className="text-[10px] font-inter text-gray-500">
                    Focus : Balance Ratio
                  </p>
                </div>
              </div>

              {/* New: Weekly Trend Line Chart */}
              {/* Weekly Risk Trend - Line Chart */}
              <div className="glass rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-outfit font-semibold text-white">
                      Risk Trend (4 Weeks)
                    </h3>
                    <p className="text-[9px] font-inter text-gray-500 mt-0.5">
                      Weekly campus burnout risk score
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[9px] font-inter text-gray-400">
                      Risk Score
                    </span>
                  </div>
                </div>

                {(() => {
                  const trend = burnoutAnalytics.weeklyTrend || [];

                  if (trend.length === 0) {
                    return (
                      <div className="h-40 flex items-center justify-center">
                        <p className="text-xs font-inter text-gray-500">
                          No risk trend data available.
                        </p>
                      </div>
                    );
                  }

                  const chartWidth = 600;
                  const chartHeight = 180;

                  const paddingLeft = 42;
                  const paddingRight = 18;
                  const paddingTop = 20;
                  const paddingBottom = 32;

                  const plotWidth = chartWidth - paddingLeft - paddingRight;

                  const plotHeight = chartHeight - paddingTop - paddingBottom;

                  // Fixed 0-100% risk scale
                  const minRisk = 0;
                  const maxRisk = 100;

                  const points = trend.map((item, index) => {
                    const x =
                      trend.length === 1
                        ? paddingLeft + plotWidth / 2
                        : paddingLeft +
                          (index / (trend.length - 1)) * plotWidth;

                    const risk = Number(item.risk || 0);

                    const y =
                      paddingTop +
                      ((maxRisk - risk) / (maxRisk - minRisk)) * plotHeight;

                    return {
                      ...item,
                      risk,
                      x,
                      y,
                    };
                  });

                  const linePath = points
                    .map(
                      (point, index) =>
                        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
                    )
                    .join(" ");

                  const areaPath =
                    points.length > 0
                      ? `${linePath}
           L ${points[points.length - 1].x} ${paddingTop + plotHeight}
           L ${points[0].x} ${paddingTop + plotHeight}
           Z`
                      : "";

                  const yTicks = [100, 75, 50, 25, 0];

                  return (
                    <div className="w-full overflow-hidden">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="w-full h-auto"
                        role="img"
                        aria-label="Four week burnout risk trend line chart"
                      >
                        <defs>
                          <linearGradient
                            id="riskAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#FACC15"
                              stopOpacity="0.28"
                            />
                            <stop
                              offset="100%"
                              stopColor="#FACC15"
                              stopOpacity="0.02"
                            />
                          </linearGradient>

                          <filter
                            id="riskLineGlow"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                          >
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>

                        {/* Horizontal grid lines + Y-axis labels */}
                        {yTicks.map((tick) => {
                          const y =
                            paddingTop +
                            ((maxRisk - tick) / (maxRisk - minRisk)) *
                              plotHeight;

                          return (
                            <g key={tick}>
                              <line
                                x1={paddingLeft}
                                y1={y}
                                x2={chartWidth - paddingRight}
                                y2={y}
                                stroke="rgba(255,255,255,0.07)"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />

                              <text
                                x={paddingLeft - 10}
                                y={y + 3}
                                textAnchor="end"
                                fill="#6B7280"
                                fontSize="9"
                                fontFamily="Inter, sans-serif"
                              >
                                {tick}%
                              </text>
                            </g>
                          );
                        })}

                        {/* Area below line */}
                        <motion.path
                          d={areaPath}
                          fill="url(#riskAreaGradient)"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.7 }}
                        />

                        {/* Main trend line */}
                        <motion.path
                          d={linePath}
                          fill="none"
                          stroke="#FACC15"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#riskLineGlow)"
                          initial={{
                            pathLength: 0,
                            opacity: 0,
                          }}
                          animate={{
                            pathLength: 1,
                            opacity: 1,
                          }}
                          transition={{
                            duration: 1,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Data points */}
                        {points.map((point, index) => (
                          <g key={`${point.week}-${index}`}>
                            {/* Percentage directly above each dot */}
                            <motion.text
                              x={point.x}
                              y={point.y - 16}
                              textAnchor="middle"
                              fill="#FACC15"
                              fontSize="11"
                              fontWeight="700"
                              fontFamily="Inter, sans-serif"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{
                                duration: 0.4,
                                delay: 0.5 + index * 0.12,
                              }}
                            >
                              {point.risk}%
                            </motion.text>

                            {/* Outer point */}
                            <motion.circle
                              cx={point.x}
                              cy={point.y}
                              r="7"
                              fill="rgba(250, 204, 21, 0.18)"
                              initial={{ r: 0 }}
                              animate={{ r: 7 }}
                              transition={{
                                duration: 0.3,
                                delay: 0.45 + index * 0.12,
                              }}
                            />

                            {/* Inner point */}
                            <motion.circle
                              cx={point.x}
                              cy={point.y}
                              r="4"
                              fill="#FACC15"
                              stroke="#12121a"
                              strokeWidth="2"
                              initial={{ r: 0 }}
                              animate={{ r: 4 }}
                              transition={{
                                duration: 0.3,
                                delay: 0.55 + index * 0.12,
                              }}
                            />

                            {/* Week label */}
                            <text
                              x={point.x}
                              y={chartHeight - 8}
                              textAnchor="middle"
                              fill="#6B7280"
                              fontSize="9"
                              fontFamily="Inter, sans-serif"
                            >
                              {point.week}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* Faculty Breakdown */}
              <div className="glass rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-outfit font-semibold text-white mb-3">
                  Faculty Risk Breakdown
                </h3>
                <div className="space-y-3">
                  {burnoutAnalytics.facultyBreakdown
                    .sort((a, b) => b.risk - a.risk)
                    .map((fac) => (
                      <div key={fac.faculty}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-inter text-gray-400">
                            {fac.faculty}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-inter text-gray-600">
                              {fac.students} students
                            </span>
                            <span
                              className={`text-[10px] font-inter font-bold ${fac.risk > 50 ? "text-red-400" : fac.risk > 35 ? "text-yellow-400" : "text-green-400"}`}
                            >
                              {fac.risk}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full">
                          <motion.div
                            className={`h-full rounded-full ${fac.risk > 50 ? "bg-gradient-to-r from-orange-500 to-red-500" : fac.risk > 35 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-emerald-500"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${fac.risk}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <AdminAIWellnessWidget
                burnoutAnalytics={burnoutAnalytics}
                fallbackRecommendations={
                  analytics.burnoutTelemetry.recommendations
                }
              />
            </motion.div>
          )}

          {/* ACCESS CONTROL SECTION */}
          {activeSection === "access" && (
            <motion.div
              key="access"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-lg font-outfit font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={18} /> Role-Based Access Control
              </h2>

              {/* Admin Users */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-outfit font-semibold text-gray-300">
                    Admin Users
                  </h3>
                  {normalizedUserRole === "super_admin" && (
                    <button
                      onClick={() => setShowCreateUserModal(true)}
                      className="text-[10px] font-inter font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-taylor-red">+</span> Add Account
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {adminUsersLoading ? (
                    <p className="text-xs text-gray-500">
                      Loading admin users...
                    </p>
                  ) : supabaseAdminUsers.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No admin users found.
                    </p>
                  ) : (
                    supabaseAdminUsers.map((admin) => (
                      <div
                        key={admin.id}
                        className="glass rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-taylor-red to-taylor-red-dark flex items-center justify-center text-sm font-bold text-white">
                            {admin.avatar ||
                              admin.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-outfit font-semibold text-white">
                              {admin.full_name || admin.name}
                            </p>
                            <p className="text-[10px] font-inter text-gray-500">
                              {admin.faculty || "Taylor's University"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[10px] font-inter font-bold px-2 py-0.5 rounded-full ${
                              admin.role === "super_admin" ||
                              admin.role === "Super Admin"
                                ? "bg-taylor-red/10 text-taylor-red border border-taylor-red/20"
                                : admin.role === "admin" ||
                                    admin.role === "Event Manager"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                            }`}
                          >
                            {admin.role === "super_admin"
                              ? "Super Admin"
                              : admin.role === "admin"
                                ? "Event Manager"
                                : admin.role === "analytics_viewer"
                                  ? "Analytics Viewer"
                                  : admin.role}
                          </span>
                          <p className="text-[9px] font-inter text-gray-600 mt-1">
                            {admin.last_login
                              ? new Date(admin.last_login).toLocaleString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Never logged in"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Role Permissions Matrix */}
              <div>
                <h3 className="text-sm font-outfit font-semibold text-gray-300 mb-3">
                  Permissions Matrix
                </h3>
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-4 gap-0 text-center">
                    <div className="p-2.5 bg-white/[0.02] border-b border-r border-white/5">
                      <span className="text-[9px] font-inter font-bold text-gray-500 uppercase">
                        Permission
                      </span>
                    </div>
                    {Object.keys(roles).map((role) => (
                      <div
                        key={role}
                        className="p-2.5 bg-white/[0.02] border-b border-r border-white/5 last:border-r-0"
                      >
                        <span className="text-[9px] font-inter font-bold text-gray-400">
                          {role}
                        </span>
                      </div>
                    ))}
                    {[
                      "canCreate",
                      "canEdit",
                      "canDelete",
                      "canViewAnalytics",
                      "canManageUsers",
                      "canViewBurnout",
                    ].map((perm) => (
                      <div key={perm} className="contents">
                        <div className="p-2.5 border-b border-r border-white/5 text-left">
                          <span className="text-[10px] font-inter text-gray-400">
                            {perm
                              .replace("can", "")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </span>
                        </div>
                        {Object.values(roles).map((rolePerms, i) => (
                          <div
                            key={i}
                            className="p-2.5 border-b border-r border-white/5 last:border-r-0 flex items-center justify-center"
                          >
                            {rolePerms[perm] ? (
                              <span className="text-green-400 text-xs">✅</span>
                            ) : (
                              <span className="text-red-400 text-xs">❌</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Event Modal — Bottom Sheet Style */}
      {/* Create / Edit Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEventModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
            />

            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#12121a] rounded-t-3xl z-[301] border-t border-white/10"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-6 pb-3">
                <div>
                  <h3 className="text-lg font-outfit font-bold text-white">
                    {eventModalMode === "edit" ? "Edit Event" : "Create Event"}
                  </h3>
                  {/* <p className="text-[10px] font-inter text-gray-500">
                    {isSupabaseOnline
                      ? "Connected to Supabase"
                      : "Local demo mode"}
                  </p> */}
                </div>

                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1.5 rounded-lg glass"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div
                className="overflow-y-auto px-6 pb-8"
                style={{ maxHeight: "calc(85vh - 80px)" }}
              >
                {eventsError && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {eventsError}
                  </div>
                )}

                <div className="space-y-3">
                  <input
                    value={eventDraft.title}
                    onChange={(e) =>
                      updateEventDraft({ title: e.target.value })
                    }
                    placeholder="Event title"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />

                  <input
                    value={eventDraft.host}
                    onChange={(e) => updateEventDraft({ host: e.target.value })}
                    placeholder="Host / Club"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={eventDraft.date}
                      onChange={(e) =>
                        updateEventDraft({ date: e.target.value })
                      }
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />

                    <input
                      type="time"
                      value={eventDraft.time}
                      onChange={(e) =>
                        updateEventDraft({ time: e.target.value })
                      }
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>

                  <input
                    value={eventDraft.location}
                    onChange={(e) =>
                      updateEventDraft({ location: e.target.value })
                    }
                    placeholder="Location"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={eventDraft.category}
                      onChange={(e) =>
                        updateEventDraft({
                          category: e.target.value,
                          emoji: e.target.value === "focus" ? "📚" : "🌿",
                        })
                      }
                      className="px-3 py-2.5 bg-[#1a1a22] border border-white/20 rounded-xl text-white text-sm font-medium shadow-lg"
                    >
                      <option value="focus" className="bg-[#12121a] text-white">
                        📚 Focus
                      </option>
                      <option
                        value="balance"
                        className="bg-[#12121a] text-white"
                      >
                        🌿 Balance
                      </option>
                    </select>

                    <input
                      type="number"
                      value={eventDraft.capacity}
                      onChange={(e) =>
                        updateEventDraft({ capacity: Number(e.target.value) })
                      }
                      placeholder="Capacity"
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                    />
                  </div>

                  <input
                    value={eventDraft.zone}
                    onChange={(e) => updateEventDraft({ zone: e.target.value })}
                    placeholder="Zone"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
                  />

                  <select
                    value={eventDraft.tag}
                    onChange={(e) => updateEventDraft({ tag: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#1a1a22] border border-white/20 rounded-xl text-white text-sm font-medium shadow-lg"
                  >
                    <option value="" className="bg-[#12121a] text-gray-400">
                      Select Category Tag
                    </option>
                    <option value="Technology" className="bg-[#12121a] text-white">
                      💻 Technology
                    </option>
                    <option value="Career" className="bg-[#12121a] text-white">
                      💼 Career
                    </option>
                    <option value="Wellness" className="bg-[#12121a] text-white">
                      🧘 Wellness
                    </option>
                    <option value="Social" className="bg-[#12121a] text-white">
                      👥 Social
                    </option>
                    <option value="Creative" className="bg-[#12121a] text-white">
                      🎨 Creative
                    </option>
                    <option value="Academic" className="bg-[#12121a] text-white">
                      📖 Academic
                    </option>
                    <option value="Fitness" className="bg-[#12121a] text-white">
                      🏃 Fitness
                    </option>
                    <option value="Athletics" className="bg-[#12121a] text-white">
                      🏀 Athletics
                    </option>
                    <option value="Networking" className="bg-[#12121a] text-white">
                      🤝 Networking
                    </option>
                    <option value="Entertainment" className="bg-[#12121a] text-white">
                      🎬 Entertainment
                    </option>
                    <option value="Community" className="bg-[#12121a] text-white">
                      🎲 Community
                    </option>
                    <option value="Communication" className="bg-[#12121a] text-white">
                      🗣️ Communication
                    </option>
                    <option value="Cloud" className="bg-[#12121a] text-white">
                      ☁️ Cloud
                    </option>
                    <option value="Data Science" className="bg-[#12121a] text-white">
                      📊 Data Science
                    </option>
                    <option value="Software Engineering" className="bg-[#12121a] text-white">
                      🧪 Software Engineering
                    </option>
                  </select>

                  <textarea
                    value={eventDraft.description}
                    onChange={(e) =>
                      updateEventDraft({ description: e.target.value })
                    }
                    placeholder="Description"
                    rows={3}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm resize-none"
                  />

                  <button
                    disabled={eventsLoading}
                    onClick={handleSaveEvent}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-taylor-red to-taylor-red-light text-white text-sm font-outfit font-semibold shadow-glow-red disabled:opacity-50"
                  >
                    {eventsLoading
                      ? "Saving..."
                      : eventModalMode === "edit"
                        ? "Save Changes"
                        : "Create Event"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateUserModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateUserModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[300]"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#12121a] rounded-t-3xl z-[301] border-t border-white/10"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-6 pb-3">
                <h3 className="text-lg font-outfit font-bold text-white">
                  Create Admin Account
                </h3>
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="p-1.5 rounded-lg glass"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div
                className="overflow-y-auto px-6 pb-8"
                style={{ maxHeight: "calc(85vh - 80px)" }}
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-inter font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Ms. Sarah"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-taylor-red"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-inter font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                      Campus Email *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="e.g. sarah.admin@taylors.edu.my"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-taylor-red"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-inter font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="e.g. tempPass123"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-taylor-red"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-inter font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                        Role
                      </label>
                      <select
                        value={newUser.role}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-taylor-red"
                      >
                        <option
                          value="Event Manager"
                          className="bg-[#12121a] text-white"
                        >
                          Event Manager
                        </option>
                        <option
                          value="Analytics Viewer"
                          className="bg-[#12121a] text-white"
                        >
                          Analytics Viewer
                        </option>
                        <option
                          value="Super Admin"
                          className="bg-[#12121a] text-white"
                        >
                          Super Admin
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-inter font-medium text-gray-400 uppercase tracking-wider mb-1 block">
                        Faculty/Dept
                      </label>
                      <select
                        value={newUser.faculty}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            faculty: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-taylor-red"
                      >
                        {[
                          "Computing",
                          "Engineering",
                          "Business",
                          "Design",
                          "Hospitality",
                        ].map((faculty) => (
                          <option
                            key={faculty}
                            value={faculty}
                            className="bg-[#12121a] text-white"
                          >
                            {faculty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreateUser}
                  className="w-full mt-6 bg-taylor-red hover:bg-taylor-red-light text-white font-bold py-3.5 rounded-xl transition-colors shadow-glow-red"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
