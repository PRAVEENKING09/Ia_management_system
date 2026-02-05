import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { LayoutDashboard, Users, FilePlus, Save, AlertCircle, Upload, Phone, FileText, CheckCircle, Search, Filter, Mail, X, Download, Clock, BarChart2, TrendingDown, Award } from 'lucide-react';
import { facultyData, facultySubjects, studentsList, facultyClassAnalytics, labSchedule, englishMarks, mathsMarks, caegMarks } from '../utils/mockData';
import styles from './FacultyDashboard.module.css';

const FacultyDashboard = () => {
    const [activeSection, setActiveSection] = useState('Overview');
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [marks, setMarks] = useState({}); // Map { studentId: { co1: val... } }
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchTerm, setSearchTerm] = useState('');

    // API State
    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const API_BASE = 'http://localhost:8080/api/marks';

    React.useEffect(() => {
        // Fallback to Mock Data
        setSubjects(facultySubjects); // Use imported mock data directly
        setStudents(studentsList);    // Use imported mock data directly
    }, []);

    // -- Enhancement State --
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const menuItems = [
        {
            label: 'Overview',
            path: '/dashboard/faculty',
            icon: <LayoutDashboard size={20} />,
            isActive: activeSection === 'Overview',
            onClick: () => { setActiveSection('Overview'); setSelectedSubject(null); }
        },
        {
            label: 'My Students',
            path: '/dashboard/faculty',
            icon: <Users size={20} />,
            isActive: activeSection === 'My Students',
            onClick: () => { setActiveSection('My Students'); setSelectedSubject(null); }
        },
        {
            label: 'CIE Entry',
            path: '/dashboard/faculty',
            icon: <FilePlus size={20} />,
            isActive: activeSection === 'CIE Entry',
            onClick: () => { setActiveSection('CIE Entry'); setSelectedSubject(null); }
        },
    ];

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
        setActiveSection('CIE Entry');
        // Mock fetch marks for this subject
        // In a real app we would fetch by subjectId
        const marksMap = {};
        studentsList.forEach((student, index) => {
            // Generate marks based on subject
            const max1 = subject.cie1MaxMarks || 35;
            const max2 = subject.cie2MaxMarks || 15;

            let cie1 = 0, cie2 = 0;
            if (subject.name === 'English Communication') {
                const val = englishMarks[index];
                cie1 = val; // Can be 'Ab'
                cie2 = 0;
            } else if (subject.name === 'Engineering Maths-II') {
                const val = mathsMarks[index];
                if (val) {
                    cie1 = val.cie1;
                    cie2 = val.cie2;
                }
            } else if (subject.name === 'CAEG') {
                const val = caegMarks[index];
                if (val) {
                    cie1 = val.cie1;
                    cie2 = val.cie2;
                }
            } else {
                cie1 = max1 > 0 ? Math.floor(Math.random() * (max1 - 5)) + 5 : 0;
                cie2 = max2 > 0 ? Math.floor(Math.random() * (max2 - 2)) + 2 : 0;
            }

            marksMap[student.id] = {
                'CIE1': {
                    student: { id: student.id },
                    iaType: 'CIE1',
                    cie1Score: cie1,
                    cie2Score: cie2
                }
            };
        });
        setMarks(marksMap);
    };

    const handleMarkChange = (studentId, field, value) => {
        let numValue = parseInt(value, 10);
        if (value === '') numValue = 0;
        else if (isNaN(numValue)) return;

        let max = 0;
        if (field === 'cie1') max = selectedSubject?.cie1MaxMarks || 0;
        else if (field === 'cie2') max = selectedSubject?.cie2MaxMarks || 0;

        if (numValue < 0) numValue = 0;
        if (numValue > max) numValue = max;

        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: numValue
            }
        }));
    };

    const calculateAverage = (student) => {
        if (selectedSubject) {
            const sMarks = marks[student.id] || {};
            const ia1Mark = sMarks['CIE1'] || {};
            const valCIE1 = sMarks.cie1 !== undefined ? sMarks.cie1 : (ia1Mark.cie1Score != null ? ia1Mark.cie1Score : 0);
            const valCIE2 = sMarks.cie2 !== undefined ? sMarks.cie2 : (ia1Mark.cie2Score != null ? ia1Mark.cie2Score : 0);
            return (Number(valCIE1) || 0) + (Number(valCIE2) || 0);
        }
        return "-";
    };

    const handleSave = async () => {
        setSaving(true);
        const updates = [];

        // Mock Save Operation
        // We simulate a delay to show the "Saving..." state
        const mockSave = new Promise((resolve) => {
            setTimeout(() => {
                resolve('Success');
            }, 800);
        });

        // Update local state is already happening via setMarks in handleMarkChange
        // But we might want to consolidate 'marks' if we had a separate 'edited' state like in HOD dash
        // For here, just waiting is enough to simulate API call
        updates.push(mockSave);

        try {
            await Promise.all(updates);
            showToast('CIE Marks Saved & Synced!', 'success');
        } catch (e) {
            showToast('Error saving marks', 'error');
        } finally {
            setSaving(false);
        }
    };

    // --- NEW FEATURE: EXPORT CSV ---
    const downloadCSV = () => {
        const headers = ['Reg No', 'Name', 'Section', 'Batch', 'CIE-1', 'CIE-2', 'CIE-3', 'Average'];
        const rows = marks.map(s => [
            s.rollNo,
            s.name,
            s.section,
            s.batch,
            s.ia1 || 0,
            s.ia2 || 0,
            s.ia3 || 0,
            calculateAverage(s)
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CIE_Marks_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Marks Exported to CSV', 'success');
    };

    // --- NEW FEATURE: PROFILE MODAL ---
    const openProfile = (student) => {
        setSelectedStudent(student);
        setShowProfileModal(true);
    };

    const renderStudentProfileModal = () => {
        if (!showProfileModal || !selectedStudent) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowProfileModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>Student Profile</h2>
                        <button className={styles.closeBtn} onClick={() => setShowProfileModal(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.profileHeader}>
                            <div className={styles.profileAvatar}>
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div className={styles.profileInfo}>
                                <h3>{selectedStudent.name}</h3>
                                <p className={styles.profileMeta}>{selectedStudent.rollNo}</p>
                                <span className={`${styles.badge} ${styles.good}`}>
                                    {selectedStudent.sem} Sem - {selectedStudent.section} ({selectedStudent.batch})
                                </span>
                            </div>
                        </div>

                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email Address</span>
                                <span className={styles.infoValue}>{selectedStudent.rollNo.toLowerCase()}@college.edu</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Attendance</span>
                                <div className={styles.attendanceBarContainer}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span>Current Semester</span>
                                        <span style={{ fontWeight: 'bold' }}>{selectedStudent.attendance}%</span>
                                    </div>
                                    <div className={styles.attendanceTrack}>
                                        <div className={styles.attendanceFill} style={{ width: `${selectedStudent.attendance}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Academic Standing</span>
                                <span className={styles.infoValue} style={{ color: '#059669' }}>Good Standing</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Parent Contact</span>
                                <span className={styles.infoValue}>+91 98765 43210</span>
                            </div>
                        </div>

                        <button className={styles.saveBtn} style={{ width: '100%' }} onClick={() => showToast('Full Report Downloaded')}>
                            <FileText size={18} /> Download Full Academic Report
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- NEW FEATURE: UPLOAD MODAL ---
    const renderUploadModal = () => {
        if (!showUploadModal) return null;

        return (
            <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>Bulk Upload Marks</h2>
                        <button className={styles.closeBtn} onClick={() => setShowUploadModal(false)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <div className={styles.uploadArea} onClick={() => {
                            showToast('File Upload Simulation Success');
                            setShowUploadModal(false);
                        }}>
                            <Upload size={48} color="#2563eb" />
                            <div>
                                <p className={styles.uploadText}>Click to upload or drag and drop</p>
                                <p className={styles.uploadSubtext}>Excel, CSV files only (Max 2MB)</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className={styles.secondaryBtn} onClick={() => setShowUploadModal(false)}>Cancel</button>
                            <button className={styles.saveBtn} disabled>Upload Pending...</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // --- VIEW RENDERERS ---

    const renderOverview = () => (
        <>
            <div className={styles.analyticsGrid}>
                {/* Same Analytics cards as before */}
                <div className={styles.analyticsCard}>
                    <h3 className={styles.analyticsTitle}>CIE STATUS</h3>
                    <div className={styles.analyticsContent}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultySubjects.reduce((acc, curr) => acc + curr.studentCount, 0)}</span>
                            <span className={styles.statLabel}><Users size={14} /> Total Students</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.evaluated}</span>
                            <span className={styles.statLabel}><CheckCircle size={14} /> Evaluated</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.pending}</span>
                            <span className={styles.statLabel}><Clock size={14} /> Pending</span>
                        </div>
                    </div>
                </div>
                <div className={styles.analyticsCard}>
                    <h3 className={styles.analyticsTitle}>CLASS ANALYTICS</h3>
                    <div className={styles.analyticsContent}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.avgScore}%</span>
                            <span className={styles.statLabel}><BarChart2 size={14} /> Avg Score</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.lowPerformers}</span>
                            <span className={styles.statLabel}><TrendingDown size={14} /> Low Performers</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{facultyClassAnalytics.topPerformers}</span>
                            <span className={styles.statLabel}><Award size={14} /> Top Performers</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContentGrid}>
                <div className={styles.leftColumn}>
                    <section>
                        <h2 className={styles.sectionTitle}>My Subjects</h2>
                        <div className={styles.cardsGrid}>
                            {facultySubjects.map(sub => (
                                <div key={sub.id} className={styles.subjectCard} onClick={() => handleSubjectClick(sub)}>
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.subjectName}>{sub.name}</h3>
                                        <span className={styles.termBadge}>{sub.semester} Sem</span>
                                    </div>
                                    <div className={styles.subjectFooter}>
                                        <div className={styles.cardStats}>
                                            <Users size={16} color="#6b7280" />
                                            <span>{sub.studentCount} Students</span>
                                        </div>
                                        <span className={styles.progressBadge}>85% Comp</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section>
                        <h2 className={styles.sectionTitle}>Quick Actions</h2>
                        <div className={styles.quickActionsGrid}>
                            <button className={styles.actionBtn} onClick={() => showToast('Report Generated!')}>
                                <FileText size={18} /> Generate Report
                            </button>
                            <button className={styles.actionBtn} onClick={() => setShowUploadModal(true)}>
                                <Upload size={18} /> Bulk Marks Upload
                            </button>
                            <button className={styles.actionBtn} onClick={() => showToast('Calling Parent...')}>
                                <Phone size={18} /> Parent Call
                            </button>
                            <button className={styles.actionBtn} onClick={() => showToast('Downloading Attendance Sheet...')}>
                                <Users size={18} /> Attendance Sheet
                            </button>
                        </div>
                    </section>
                </div>
                <div className={styles.rightColumn}>
                    <div className={styles.labCard}>
                        <h2 className={styles.cardTitle}>Lab Scheduler 📅</h2>
                        <div className={styles.scheduleList}>
                            {labSchedule.map(slot => (
                                <div key={slot.id} className={styles.scheduleItem}>
                                    <div className={styles.scheduleTime}>
                                        <span className={styles.day}>{slot.day}</span>
                                        <span className={styles.time}>{slot.time}</span>
                                    </div>
                                    <div className={styles.scheduleInfo}>
                                        <span className={styles.labName}>{slot.lab}</span>
                                        <span className={styles.batch}>{slot.batch}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderMyStudents = () => {
        // Use API students
        const filteredStudents = students
            .filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.regNo.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>My Students Directory</h2>
                    <div className={styles.headerActions}>
                        <div className={styles.searchWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className={styles.filterBtn}><Filter size={16} /> Filter</button>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Reg No</th>
                                    <th>Name</th>
                                    <th>Semester</th>
                                    <th>Section</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((std) => (
                                    <tr key={std.id} style={{ cursor: 'pointer' }} onClick={() => openProfile(std)}>
                                        <td className={styles.codeText}>{std.regNo}</td>
                                        <td className={styles.subjectText}>{std.name}</td>
                                        <td>{std.semester}</td>
                                        <td>{std.section}</td>
                                        <td>
                                            <div className={styles.actionIcons}>
                                                <button title="View Profile" className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); openProfile(std); }}>
                                                    <Users size={16} />
                                                </button>
                                                <button title="Email" className={styles.iconBtn} onClick={(e) => e.stopPropagation()}>
                                                    <Mail size={16} />
                                                </button>
                                                <button title="Report" className={styles.iconBtn} onClick={(e) => e.stopPropagation()}>
                                                    <AlertCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderCIEEntry = () => {
        if (!selectedSubject) {
            return (
                <div className={styles.emptyState}>


                    <div className={styles.cardsGrid}>
                        {subjects.map(sub => (
                            <div key={sub.id} className={styles.subjectCard} onClick={() => handleSubjectClick(sub)}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.subjectName}>{sub.name}</h3>
                                    <span className={styles.termBadge}>{sub.semester} Sem</span>
                                </div>
                                <div className={styles.subjectFooter}>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                                        {sub.code}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitleGroup}>
                        <button className={styles.backBtn} onClick={() => setSelectedSubject(null)}>← Back</button>
                        <div>
                            <h2 className={styles.sectionTitle}>Update Marks: {selectedSubject.name}</h2>
                            <p className={styles.sectionSubtitle}>{selectedSubject.code} | {selectedSubject.department}</p>
                            <span className={styles.modeBadge}>
                                Max Marks: CIE-1({selectedSubject.cie1MaxMarks}), CIE-2({selectedSubject.cie2MaxMarks})
                            </span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        <button className={`${styles.saveBtn} ${saving ? styles.saving : ''}`} onClick={handleSave} disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Sl No</th>
                                    <th>Reg No</th>
                                    <th>Student Name</th>
                                    {selectedSubject?.cie1MaxMarks > 0 && <th>CIE-1 ({selectedSubject.cie1MaxMarks})</th>}
                                    {selectedSubject?.cie2MaxMarks > 0 && <th>CIE-2 ({selectedSubject.cie2MaxMarks})</th>}
                                    <th>Total ({selectedSubject?.totalMaxMarks})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => {
                                    const sMarks = marks[student.id] || {};
                                    // Mapping logic: local edits override API data
                                    // In handleSubjectClick, we populated 'marks' with API data using [iaType] keys.
                                    // 'CIE1' is hardcoded for now, as per HOD dashboard.
                                    const ia1Mark = sMarks['CIE1'] || {};

                                    // Check if we have a direct edit (top-level key) or fallback to API object
                                    const valCIE1 = sMarks.cie1 !== undefined ? sMarks.cie1 : (ia1Mark.cie1Score != null ? ia1Mark.cie1Score : '');
                                    const valCIE2 = sMarks.cie2 !== undefined ? sMarks.cie2 : (ia1Mark.cie2Score != null ? ia1Mark.cie2Score : '');

                                    const total = (Number(valCIE1) || 0) + (Number(valCIE2) || 0);

                                    return (
                                        <tr key={student.id}>
                                            <td>{index + 1}</td>
                                            <td>{student.regNo}</td>
                                            <td>{student.name}</td>
                                            {selectedSubject?.cie1MaxMarks > 0 && (
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.markInput}
                                                        value={valCIE1}
                                                        onChange={(e) => handleMarkChange(student.id, 'cie1', e.target.value)}
                                                    />
                                                </td>
                                            )}
                                            {selectedSubject?.cie2MaxMarks > 0 && (
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.markInput}
                                                        value={valCIE2}
                                                        onChange={(e) => handleMarkChange(student.id, 'cie2', e.target.value)}
                                                    />
                                                </td>
                                            )}
                                            <td style={{ fontWeight: 'bold' }}>{Math.min(total, selectedSubject?.totalMaxMarks || 100)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };



    return (
        <DashboardLayout menuItems={menuItems}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.welcomeText}>Hello, {facultyData.name}</h1>
                    <p className={styles.subtitle}>{facultyData.designation} | {facultyData.department}</p>
                </div>
            </header>

            {activeSection === 'Overview' && renderOverview()}
            {activeSection === 'My Students' && renderMyStudents()}
            {activeSection === 'CIE Entry' && renderCIEEntry()}

            {/* MODALS */}
            {renderStudentProfileModal()}
            {renderUploadModal()}

            {toast.show && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.error : ''}`}>
                    <CheckCircle size={18} />
                    {toast.message}
                </div>
            )}
        </DashboardLayout>
    );
};

export default FacultyDashboard;
