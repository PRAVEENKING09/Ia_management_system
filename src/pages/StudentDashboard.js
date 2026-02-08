import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API_BASE_URL from '../config/api';
import { LayoutDashboard, FileText, Calendar, Book, User, Download, Bell, TrendingUp, Award, Clock, CheckCircle, Mail, MapPin, ChevronDown, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './StudentDashboard.module.css';

// --- DATA DEFINITIONS ---

// --- DATA DEFINITIONS ---

// studentInfo moved to component state


// --- MOCK DATA REMOVED ---
// All data is now fetched from the backend.

// --- COMPONENT ---

const StudentDashboard = () => {
    const [activeSection, setActiveSection] = useState('Overview');
    const [toast, setToast] = useState({ show: false, message: '' });

    const { user } = useAuth(); // Get auth context

    // API State
    const [realMarks, setRealMarks] = useState([]);
    const [realSubjects, setRealSubjects] = useState([]);
    const [cieStatus, setCieStatus] = useState("0/3");

    // CIE & Notification State
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

    // Student Profile State
    const [studentInfo, setStudentInfo] = useState({
        name: 'Loading...',
        rollNo: user?.username || '...',
        branch: '...',
        semester: '...',
        attendance: 0,
        cgpa: 0
    });

    React.useEffect(() => {
        const fetchMarks = async () => {
            try {
                // Return if no user/token
                if (!user || !user.token) return;

                const response = await fetch(`${API_BASE_URL}/marks/my-marks`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched Marks:", data);
                    setRealMarks(data);

                    // Calculate Summary Stats
                    const totalMarks = data.reduce((sum, m) => sum + (m.totalScore || 0), 0);
                    const totalMaxMarks = data.reduce((sum, m) => sum + (m.subject?.maxMarks || 50), 0); // Default 50 if missing

                    // Avg Score scaled to 25 (as per UI requirement "22/25")
                    // Formula: (Total Obtained / Total Max) * 25
                    let avgScore25 = 0;
                    if (totalMaxMarks > 0) {
                        avgScore25 = Math.round((totalMarks / totalMaxMarks) * 25);
                    }

                    // Attendance Calculation (Average of all CIE entries)
                    const totalAttendance = data.reduce((sum, m) => sum + (m.attendancePercentage || 0), 0);
                    const avgAttendance = data.length > 0 ? Math.round(totalAttendance / data.length) : 0;

                    if (data.length > 0) {
                        const s = data[0].student;
                        setStudentInfo({
                            name: s.name,
                            rollNo: s.regNo,
                            branch: s.department,
                            semester: s.semester,
                            attendance: avgAttendance, // Real avg attendance
                            cgpa: 8.5, // CGPA still hardcoded as it's not in CIE data
                            avgCieScore: `${avgScore25}/25` // Store formatted score
                        });
                    }

                    // Calculate CIEs Completed
                    const uniqueCIEs = new Set(data.map(m => m.cieType));
                    const completedCount = uniqueCIEs.size;
                    // Assuming total 3 CIEs for now based on user context
                    setCieStatus(`${completedCount}/5`);

                    // Group marks by subject
                    const groupedMarks = {};

                    data.forEach(mark => {
                        // Safety check for subject
                        if (!mark.subject) return;

                        const subId = mark.subject.id;
                        if (!groupedMarks[subId]) {
                            groupedMarks[subId] = {
                                subject: mark.subject,
                                cie1Score: null,
                                cie2Score: null,
                                totalScore: 0,
                                attendance: 0,
                                count: 0
                            };
                        }

                        if (mark.cieType === 'CIE1') {
                            groupedMarks[subId].cie1Score = mark.totalScore;
                        } else if (mark.cieType === 'CIE2') {
                            groupedMarks[subId].cie2Score = mark.totalScore;
                        } else if (mark.cieType === 'CIE3') {
                            groupedMarks[subId].cie3Score = mark.totalScore;
                        } else if (mark.cieType === 'CIE4') {
                            groupedMarks[subId].cie4Score = mark.totalScore;
                        } else if (mark.cieType === 'CIE5') {
                            groupedMarks[subId].cie5Score = mark.totalScore;
                        }

                        groupedMarks[subId].attendance += (mark.attendancePercentage || 0);
                        groupedMarks[subId].count++;
                    });

                    // Calculate totals (Average of (CIE1 + CIE2)) or similar logic
                    Object.values(groupedMarks).forEach(item => {
                        let sum = 0;
                        let c = 0;
                        if (item.cie1Score != null) { sum += item.cie1Score; c++; }
                        if (item.cie2Score != null) { sum += item.cie2Score; c++; }
                        if (item.cie3Score != null) { sum += item.cie3Score; c++; }
                        if (item.cie4Score != null) { sum += item.cie4Score; c++; }
                        if (item.cie5Score != null) { sum += item.cie5Score; c++; }

                        // Simple Average or Total based on policy
                        item.totalScore = sum;
                    });

                    setRealMarks(Object.values(groupedMarks));

                    // Extract unique subjects from the marks
                    const subjects = Object.values(groupedMarks).map(g => ({
                        id: g.subject.id,
                        name: g.subject.name,
                        code: g.subject.code,
                        cie1MaxMarks: g.subject.maxMarks,
                        cie2MaxMarks: g.subject.maxMarks,
                        cie3MaxMarks: g.subject.maxMarks,
                        cie4MaxMarks: g.subject.maxMarks,
                        cie5MaxMarks: g.subject.maxMarks,
                        totalMaxMarks: g.subject.maxMarks,
                        department: g.subject.department,
                        semester: g.subject.semester
                    }));

                    setRealSubjects(subjects);



                } else {
                    console.error("Failed to fetch marks");
                }
            } catch (error) {
                console.error("Error fetching marks:", error);
            }
        };

        fetchMarks();

        // Fetch Announcements & Notifications
        const fetchUpdates = async () => {
            if (!user || !user.token) return;

            try {
                // Announcements
                const annRes = await fetch(`${API_BASE_URL}/cie/student/announcements`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (annRes.ok) {
                    const anns = await annRes.json();
                    setUpcomingExams(anns.map(a => ({
                        id: a.id,
                        exam: `CIE-${a.cieNumber}`,
                        subject: a.subject?.name || 'Subject',
                        date: a.scheduledDate,
                        time: a.startTime ? a.startTime.substring(0, 5) : 'TBD',
                        duration: a.durationMinutes + ' mins',
                        room: a.examRoom || 'TBD',
                        instructions: a.instructions
                    })));
                }

                // Notifications
                try {
                    const notifRes = await fetch(`${API_BASE_URL}/cie/student/notifications`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    });
                    if (notifRes.ok) {
                        const notifs = await notifRes.json();
                        setNotifications(notifs.map(n => ({
                            id: n.id,
                            message: n.message,
                            time: new Date(n.createdAt).toLocaleDateString(), // Format nicer
                            type: n.type === 'CIE_ANNOUNCEMENT' ? 'info' : 'alert',
                            isRead: n.isRead
                        })));
                    } else {
                        // Fallback to mock notifications if API fails or empty
                        setNotifications([
                            { id: 1, message: 'Welcome to the new CIE System!', time: 'Just now', type: 'info', isRead: false }
                        ]);
                    }
                } catch (notifError) {
                    console.error("Error fetching notifications:", notifError);
                    setNotifications([
                        { id: 1, message: 'Welcome to the new CIE System!', time: 'Just now', type: 'info', isRead: false }
                    ]);
                }
                // Calculate unread count
                setUnreadCount(notifications.filter(n => !n.isRead).length);
            } catch (e) {
                console.error("Error fetching updates:", e);
            } finally {
                setLoadingAnnouncements(false);
            }
        };

        fetchUpdates();
    }, [user]);

    // Filter States
    const [selectedSemester, setSelectedSemester] = useState('5');
    const [selectedCIE, setSelectedCIE] = useState('All');

    const menuItems = [
        { label: 'Overview', path: '/dashboard/student', icon: <LayoutDashboard size={20} />, isActive: activeSection === 'Overview', onClick: () => setActiveSection('Overview') },
        { label: 'CIE Marks', path: '/dashboard/student', icon: <FileText size={20} />, isActive: activeSection === 'CIE Marks', onClick: () => setActiveSection('CIE Marks') },
        { label: 'Attendance', path: '/dashboard/student', icon: <Calendar size={20} />, isActive: activeSection === 'Attendance', onClick: () => setActiveSection('Attendance') },
        { label: 'Subjects', path: '/dashboard/student', icon: <Book size={20} />, isActive: activeSection === 'Subjects', onClick: () => setActiveSection('Subjects') },
        { label: 'Faculty', path: '/dashboard/student', icon: <User size={20} />, isActive: activeSection === 'Faculty', onClick: () => setActiveSection('Faculty') },
        { label: 'Syllabus Topics', path: '/dashboard/student', icon: <BookOpen size={20} />, isActive: activeSection === 'Syllabus Topics', onClick: () => setActiveSection('Syllabus Topics') },
        { label: 'Announcements', path: '/dashboard/student', icon: <Bell size={20} />, isActive: activeSection === 'Announcements', onClick: () => setActiveSection('Announcements') },
    ];

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleDownload = () => {
        window.print();
    };

    const getStatus = (marks, max) => {
        const percentage = (marks / max) * 50;
        if (percentage >= 40) return { label: 'Distinction', color: '#166534', bg: '#dcfce7' };
        if (percentage >= 30) return { label: 'First Class', color: '#1d4ed8', bg: '#dbeafe' };
        if (percentage >= 20) return { label: 'Pass', color: '#0369a1', bg: '#e0f2fe' };
        return { label: 'At Risk', color: '#b91c1c', bg: '#fee2e2' };
    };

    const getRemarks = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 85) return "Excellent performance! Keep it up.";
        if (percentage >= 70) return "Good understanding. Focus on weak areas.";
        if (percentage >= 50) return "Average. Needs more consistent effort.";
        return "Critical: Please meet the faculty.";
    };

    const renderOverview = () => {
        return (
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📑 Current Semester Report</h2>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>CIE-1</th>
                                        <th>CIE-2</th>
                                        <th>CIE-3</th>
                                        <th>CIE-4</th>
                                        <th>CIE-5</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {realSubjects.length > 0 ? realSubjects.map((sub) => {
                                        const mark = realMarks.find(m => m.subject.id === sub.id) || {};
                                        const total = mark.totalScore || 0;
                                        const status = getStatus(total, sub.totalMaxMarks);
                                        return (
                                            <tr key={sub.id}>
                                                <td>
                                                    <div className={styles.subjectCell}>
                                                        <span className={styles.subjectName}>{sub.name}</span>
                                                        <span className={styles.subjectCode}>{sub.code}</span>
                                                    </div>
                                                </td>
                                                <td>{mark.cie1Score != null ? mark.cie1Score : '-'} / {sub.cie1MaxMarks}</td>
                                                <td>{mark.cie2Score != null ? mark.cie2Score : '-'} / {sub.cie2MaxMarks}</td>
                                                <td>{mark.cie3Score != null ? mark.cie3Score : '-'} / {sub.cie3MaxMarks}</td>
                                                <td>{mark.cie4Score != null ? mark.cie4Score : '-'} / {sub.cie4MaxMarks}</td>
                                                <td>{mark.cie5Score != null ? mark.cie5Score : '-'} / {sub.cie5MaxMarks}</td>
                                                <td className={styles.avgCell}>
                                                    {total} / {sub.totalMaxMarks}
                                                </td>
                                                <td>
                                                    <span className={styles.badge} style={{ color: status.color, background: status.bg }}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '1rem' }}>Loading real-time data or no subjects found...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>📅 Upcoming Exams</h2>
                        <div className={styles.examsList}>
                            {loadingAnnouncements ? <p>Loading schedule...</p> :
                                upcomingExams.length > 0 ? upcomingExams.map(exam => (
                                    <div key={exam.id} className={styles.examItem}>
                                        <div className={styles.examBadge}>{exam.exam}</div>
                                        <div className={styles.examInfo}>
                                            <span className={styles.examSubject}>{exam.subject}</span>
                                            <span className={styles.examDate}>
                                                {exam.date} • {exam.time} • Room: {exam.room}
                                            </span>
                                        </div>
                                        <Clock size={16} className={styles.examIcon} />
                                    </div>
                                )) : <p style={{ color: '#6b7280', padding: '1rem' }}>No upcoming exams scheduled.</p>}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>🔔 Notifications</h2>
                        <div className={styles.notificationsList}>
                            {notifications.map(notif => (
                                <div key={notif.id} className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ''}`}>
                                    <div className={`${styles.notifDot} ${styles[notif.type] || styles.info}`}></div>
                                    <div className={styles.notifContent}>
                                        <p className={styles.notifMessage}>{notif.message}</p>
                                        <span className={styles.notifTime}>{notif.time}</span>
                                    </div>
                                </div>
                            ))}
                            {notifications.length === 0 && <p style={{ padding: '1rem' }}>No new notifications.</p>}
                        </div>
                    </div>
                </div>
            </div>
        )
    };

    const renderCIEMarks = () => {
        // Filter marks for the selected semester
        const semesterMarks = realMarks.filter(m => m.subject.semester === selectedSemester || (m.subject.semester && m.subject.semester.endsWith(selectedSemester)));

        // We need to separate Theory and Labs based on subject type or code conventions
        // Assuming Labs have clear distinction or use Subject Type if available. 
        // For now, let's try to map them based on code (usually 'P' or 'L' in code means Lab/Practical)
        // or check if 'cie1MaxMarks' etc are different.

        const theorySubjects = [];
        const labSubjects = [];

        realSubjects.forEach(sub => {
            // Check if subject belongs to selected semester
            // Normalize semester strings (e.g., "5" vs "Semester 5")
            const subSem = sub.semester ? sub.semester.toString() : "";
            if (!subSem.includes(selectedSemester)) return;

            const mark = realMarks.find(m => m.subject.id === sub.id) || {};

            // Heuristic for Lab vs Theory: Check code suffix or type
            const isLab = sub.code.endsWith('P') || sub.code.endsWith('L') || sub.type === 'LAB';

            // Calculate total based on selected CIE filter
            let total;
            if (selectedCIE === 'CIE-1') {
                total = mark.cie1Score || 0;
            } else if (selectedCIE === 'CIE-2') {
                total = mark.cie2Score || 0;
            } else if (selectedCIE === 'CIE-3') {
                total = mark.cie3Score || 0;
            } else if (selectedCIE === 'CIE-4') {
                total = mark.cie4Score || 0;
            } else if (selectedCIE === 'CIE-5') {
                total = mark.cie5Score || 0;
            } else {
                // 'All' - show sum of all CIEs
                total = mark.totalScore || 0;
            }

            const item = {
                code: sub.code,
                subject: sub.name,
                cie1: mark.cie1Score != null ? mark.cie1Score : '-',
                cie2: mark.cie2Score != null ? mark.cie2Score : '-',
                cie3: mark.cie3Score != null ? mark.cie3Score : '-',
                cie4: mark.cie4Score != null ? mark.cie4Score : '-',
                cie5: mark.cie5Score != null ? mark.cie5Score : '-',
                assignment: mark.assignmentScore != null ? mark.assignmentScore : '-', // Assuming assignment score exists or is 0
                total: total,
                // Labs specific
                skill1: mark.cie1Score != null ? mark.cie1Score : '-', // Mapping CIE1 to Skill1 for labs
                skill2: mark.cie2Score != null ? mark.cie2Score : '-', // Mapping CIE2 to Skill2
                record: mark.assignmentScore != null ? mark.assignmentScore : '-', // Mapping Assignment to Record
            };

            if (isLab) {
                labSubjects.push(item);
            } else {
                theorySubjects.push(item);
            }
        });

        return (
            <div className={styles.detailsContainer}>
                {/* Print Header - Visible only in Print */}
                <div className={styles.printHeader}>
                    <h1>CIE Performance Report</h1>
                    <p>{studentInfo.name} ({studentInfo.rollNo}) | {studentInfo.branch} | Semester {selectedSemester}</p>
                </div>

                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle} style={{ fontSize: '1.25rem' }}>Semester {selectedSemester} - CIE Performance</h3>
                    <button className={styles.downloadBtn} onClick={handleDownload}>
                        <Download size={16} /> Download Report
                    </button>
                </div>

                <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.selectionRow}>
                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>Select Semester:</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    {[1, 2, 3, 4, 5, 6].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>

                        <div className={styles.selectionGroup}>
                            <label className={styles.selectionLabel}>Select CIE / Exam:</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    value={selectedCIE}
                                    onChange={(e) => setSelectedCIE(e.target.value)}
                                    className={styles.selectInput}
                                >
                                    <option value="All">All Internals</option>
                                    <option value="CIE-1">CIE - 1</option>
                                    <option value="CIE-2">CIE - 2</option>
                                    <option value="CIE-3">CIE - 3 (Skill Test)</option>
                                    <option value="CIE-4">CIE - 4 (Skill Test)</option>
                                    <option value="CIE-5">CIE - 5 (Activities)</option>
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>📘 Subjects</h2>
                        <div className={styles.badge} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                            Max CIE Marks: {selectedCIE === 'All' ? '250' : '50'}
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Subject Code</th>
                                    <th>Subject Name</th>
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <th>CIE-1</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <th>CIE-2</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-3') && <th>CIE-3</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-4') && <th>CIE-4</th>}
                                    {(selectedCIE === 'All' || selectedCIE === 'CIE-5') && <th>CIE-5</th>}

                                    <th>Total CIE</th>
                                    <th>Status</th>
                                    <th>Faculty Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {theorySubjects.length > 0 ? theorySubjects.map((item, idx) => {
                                    let maxMarks, statusScore;

                                    if (selectedCIE === 'All') {
                                        // Calculate average percentage of completed CIEs
                                        let sum = 0;
                                        let count = 0;
                                        if (item.cie1 !== '-') { sum += item.cie1; count++; }
                                        if (item.cie2 !== '-') { sum += item.cie2; count++; }
                                        if (item.cie3 !== '-') { sum += item.cie3; count++; }
                                        if (item.cie4 !== '-') { sum += item.cie4; count++; }
                                        if (item.cie5 !== '-') { sum += item.cie5; count++; }

                                        // Use average score out of 50 for status calculation
                                        statusScore = count > 0 ? sum / count : 0;
                                        maxMarks = 50;
                                    } else {
                                        // For specific CIE, use the actual score
                                        statusScore = item.total;
                                        maxMarks = 50;
                                    }

                                    const status = getStatus(statusScore, maxMarks);
                                    const remarks = getRemarks(statusScore, maxMarks);
                                    return (
                                        <tr key={idx}>
                                            <td className={styles.codeText}>{item.code}</td>
                                            <td className={styles.subjectText}>{item.subject}</td>
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-1') && <td>{item.cie1} / 50</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-2') && <td>{item.cie2} / 50</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-3') && <td>{item.cie3} / 50</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-4') && <td>{item.cie4} / 50</td>}
                                            {(selectedCIE === 'All' || selectedCIE === 'CIE-5') && <td>{item.cie5} / 50</td>}

                                            <td className={styles.totalCell}>{item.total} / {selectedCIE === 'All' ? '250' : '50'}</td>
                                            <td>
                                                <span className={styles.badge} style={{ color: status.color, background: status.bg }}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#6b7280' }}>
                                                {remarks}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No Theory Subjects Enrolled for Semester {selectedSemester}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


            </div>
        );
    };

    const renderAttendance = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.attendanceGrid}>
                {realMarks.length > 0 ? realMarks.map(item => {
                    const percentage = item.attendance || 0;
                    const status = percentage >= 85 ? 'Excellent' : percentage >= 75 ? 'Good' : 'Needs Improvement';
                    const cssClass = percentage >= 85 ? styles.excellent : percentage >= 75 ? styles.good : styles.needsFocus;

                    return (
                        <div key={item.subject.id} className={styles.attendanceCard}>
                            <div className={styles.attendanceHeader}>
                                <h3 className={styles.attendanceSubject}>{item.subject.name}</h3>
                                <span className={`${styles.badge} ${cssClass}`}>
                                    {status}
                                </span>
                            </div>
                            <div className={styles.attendanceCircle}>
                                <span className={styles.attendancePercentage}>{percentage}%</span>
                                <span className={styles.attendanceLabel}>Present</span>
                            </div>
                            <div className={styles.attendanceStats}>
                                <div className={styles.attStat}>
                                    <span>Subject Code</span>
                                    <strong>{item.subject.code}</strong>
                                </div>
                                {/* Backend might only send percentage, so hiding manual counts if not available */}
                                {/* 
                                <div className={styles.attStat}>
                                    <span>Attended</span>
                                    <strong>{item.attended}</strong>
                                </div> 
                                */}
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', padding: '3rem', width: '100%', gridColumn: '1/-1' }}>
                        <Calendar size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                        <p>No attendance data available.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSubjects = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.card}>
                <h2 className={styles.cardTitle}>📚 Registered Subjects</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Subject Name</th>
                                <th>Department</th>
                            </tr>
                        </thead>
                        <tbody>
                            {realSubjects.length > 0 ? realSubjects.map(sub => (
                                <tr key={sub.id}>
                                    <td><span className={styles.codeBadge}>{sub.code}</span></td>
                                    <td style={{ fontWeight: 500 }}>{sub.name}</td>
                                    <td>{sub.department || 'N/A'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No subjects found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderFaculty = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.facultyGrid}>
                {/* Since we don't have a direct Faculty API for students yet, we will show a placeholder or derive from subjects if possible. 
                    For now, showing a message to contact admin or check subjects tab. 
                 */}
                <div style={{ textAlign: 'center', padding: '3rem', width: '100%', gridColumn: '1/-1', background: '#f9fafb', borderRadius: '8px' }}>
                    <User size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                    <p style={{ color: '#6b7280' }}>Faculty details are being updated by the administration.</p>
                </div>
            </div>
        </div>
    );

    const renderSyllabusTopics = () => {
        const savedTracker = localStorage.getItem('syllabusTracker');
        const progress = savedTracker ? JSON.parse(savedTracker) : {};

        const savedStructure = localStorage.getItem('syllabusStructure');
        const syllabusStructure = savedStructure ? JSON.parse(savedStructure) : {};

        const savedCie = localStorage.getItem('cieSelector');
        const cieSelector = savedCie ? JSON.parse(savedCie) : {};

        const defaultUnits = [
            { id: 'u1', name: 'Unit 1: Introduction' },
            { id: 'u2', name: 'Unit 2: Core Concepts' },
            { id: 'u3', name: 'Unit 3: Advanced Topics' },
            { id: 'u4', name: 'Unit 4: Application' },
            { id: 'u5', name: 'Unit 5: Case Studies' }
        ];

        // Find CIE selected units across all subjects
        const updates = [];
        Object.keys(cieSelector).forEach(subId => {
            // Updated lookup using realSubjects
            const subject = realSubjects.find(s => s.id === parseInt(subId) || s.code === subId);
            const subName = subject ? subject.name : "Subject";

            const units = syllabusStructure[subId] || defaultUnits;

            units.forEach(u => {
                if (cieSelector[subId]?.[u.id]) {
                    updates.push({
                        sub: subName,
                        unit: u.name,
                        message: `Included in next CIE Syllabus.`
                    });
                }
            });
        });

        return (
            <div className={styles.detailsContainer}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📖 Syllabus Notifications</h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                        Notifications from faculty regarding testable units/chapters.
                    </p>

                    {updates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
                            <BookOpen size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                            <p>No syllabus updates yet.</p>
                        </div>
                    ) : (
                        <div className={styles.notificationsList}>
                            {updates.map((item, idx) => (
                                <div key={idx} className={styles.notifItem} style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff' }}>
                                    <div className={styles.notifContent}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: '600', color: '#1e40af' }}>{item.sub}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#60a5fa', background: 'white', padding: '2px 8px', borderRadius: '12px' }}>New</span>
                                        </div>
                                        <p className={styles.notifMessage} style={{ color: '#1e3a8a' }}>{item.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- ANNOUNCEMENTS SECTION ---
    const renderAnnouncements = () => {
        return (
            <div className={styles.detailsContainer}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📢 Announcements & Broadcasts</h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Important messages from HOD and faculty.</p>

                    {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '12px' }}>
                            <Bell size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                            <p>No announcements yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {notifications.map((notif, idx) => (
                                <div key={notif.id || idx} style={{
                                    padding: '1rem 1.25rem',
                                    background: notif.isRead ? '#f9fafb' : '#eff6ff',
                                    borderRadius: '10px',
                                    borderLeft: `4px solid ${notif.type === 'alert' ? '#ef4444' : notif.type === 'warning' ? '#f59e0b' : '#3b82f6'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: '600', color: '#1e40af' }}>
                                            {notif.type === 'alert' ? '🚨 Alert' : notif.type === 'warning' ? '⚠️ Warning' : '🔔 Info'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{notif.time}</span>
                                    </div>
                                    <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem' }}>{notif.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout menuItems={menuItems}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.welcomeText}>
                        {activeSection === 'Overview' ? `Welcome, ${studentInfo.name} 👋` : activeSection}
                    </h1>
                    <p className={styles.subtitle}>{studentInfo.branch} | Semester: {studentInfo.semester} | Reg No: {studentInfo.rollNo}</p>
                </div>
                <div className={styles.headerRight}>
                </div>
            </header>

            {activeSection === 'Overview' && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#dbeafe' }}>
                            <Award size={24} color="#2563eb" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{studentInfo.avgCieScore || '0/25'}</span>
                            <span className={styles.statCardLabel}>Avg CIE Score</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#dcfce7' }}>
                            <CheckCircle size={24} color="#16a34a" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{cieStatus}</span>
                            <span className={styles.statCardLabel}>CIEs Completed</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#fef3c7' }}>
                            <Calendar size={24} color="#d97706" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{studentInfo.attendance}%</span>
                            <span className={styles.statCardLabel}>Attendance</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statCardIcon} style={{ background: '#fce7f3' }}>
                            <Bell size={24} color="#db2777" />
                        </div>
                        <div className={styles.statCardContent}>
                            <span className={styles.statCardValue}>{notifications.length}</span>
                            <span className={styles.statCardLabel}>Notifications</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {activeSection === 'Overview' && renderOverview()}
            {activeSection === 'CIE Marks' && renderCIEMarks()}
            {activeSection === 'Attendance' && renderAttendance()}
            {activeSection === 'Subjects' && renderSubjects()}
            {activeSection === 'Faculty' && renderFaculty()}
            {activeSection === 'Syllabus Topics' && renderSyllabusTopics()}
            {activeSection === 'Announcements' && renderAnnouncements()}

            {/* Toast */}
            {toast.show && (
                <div className={styles.toast}>
                    <CheckCircle size={18} />
                    {toast.message}
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
