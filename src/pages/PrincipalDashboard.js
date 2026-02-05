import React, { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import styles from './PrincipalDashboard.module.css';
import {
    LayoutDashboard, Users, ShieldCheck, Calendar, BarChart2,
    Briefcase, Bell, AlertTriangle, FileText
} from 'lucide-react';

// Import Extracted Components
import { ToastNotification, SimpleModal } from '../components/dashboard/principal/Shared';
import { StudentSentinel } from '../components/dashboard/principal/Widgets';
import OverviewSection from '../components/dashboard/principal/OverviewSection';
import ComplianceSection from '../components/dashboard/principal/ComplianceSection';
import { DirectorySection } from '../components/dashboard/principal/DirectorySection';
import {
    FacultyDirectorySection, TimetablesSection, CircularsSection,
    ReportsSection, GrievancesSection
} from '../components/dashboard/principal/SectionComponents';
import {
    collegeStats, attendanceCorrelation, getStudentsByDept
} from '../utils/mockData';

const PrincipalDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // Directory State
    const [selectedDept, setSelectedDept] = useState(null);
    const [deptStudents, setDeptStudents] = useState([]);
    // Note: selectedStudentProfile state is now managed inside DirectorySection for lighter parent state, 
    // or we can pass a dummy handler if we want to keep it lifted.
    // However, the previous implementation had it here for the Modal.
    // In our refactor, DirectorySection handles its own Modal. 
    // but the `handleViewGrievance` modal is still here.

    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null); // Kept if needed, but DirectorySection has its own local logic now.

    // Interaction State
    const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
    const [activeModal, setActiveModal] = useState(null); // 'faculty', 'broadcast', 'grievance'
    const [selectedItem, setSelectedItem] = useState(null);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3000);
    }, []);

    const handleDownload = useCallback((item) => {
        showToast(`Downloading ${item.name || item.dept + ' Timetable'}...`, 'info');
    }, [showToast]);

    const handleSaveFaculty = useCallback((e) => {
        e.preventDefault();
        setActiveModal(null);
        showToast('New Faculty Added Successfully!', 'success');
    }, [showToast]);

    const handleSendBroadcast = useCallback((e) => {
        e.preventDefault();
        setActiveModal(null);
        showToast('Circular Broadcasted Successfully!', 'success');
    }, [showToast]);

    const menuItems = useMemo(() => [
        {
            label: 'Dashboard Overview',
            path: '/dashboard/principal',
            icon: <LayoutDashboard size={20} />,
            isActive: activeTab === 'overview',
            onClick: () => setActiveTab('overview')
        },
        {
            label: 'CIE Compliance Monitor',
            path: '/dashboard/principal/compliance',
            icon: <ShieldCheck size={20} />,
            isActive: activeTab === 'compliance',
            onClick: () => setActiveTab('compliance')
        },
        {
            label: 'Student Directory',
            path: '/dashboard/principal/directory',
            icon: <Users size={20} />,
            isActive: activeTab === 'directory',
            onClick: () => { setActiveTab('directory'); setSelectedDept(null); }
        },
        {
            label: 'Faculty Info',
            path: '/dashboard/principal/faculty',
            icon: <Briefcase size={20} />,
            isActive: activeTab === 'faculty',
            onClick: () => setActiveTab('faculty')
        },
        {
            label: 'Timetables',
            path: '/dashboard/principal/timetables',
            icon: <Calendar size={20} />,
            isActive: activeTab === 'timetables',
            onClick: () => setActiveTab('timetables')
        },
        {
            label: 'Circulars/Broadcasts',
            path: '/dashboard/principal/circulars',
            icon: <Bell size={20} />,
            isActive: activeTab === 'circulars',
            onClick: () => setActiveTab('circulars')
        },
        {
            label: 'Reports & Analytics',
            path: '/dashboard/principal/reports',
            icon: <BarChart2 size={20} />,
            isActive: activeTab === 'reports',
            onClick: () => setActiveTab('reports')
        },
        {
            label: 'Grievances',
            path: '/dashboard/principal/grievances',
            icon: <AlertTriangle size={20} />,
            isActive: activeTab === 'grievances',
            onClick: () => setActiveTab('grievances')
        },
    ], [activeTab]);

    /* Chart Configs and Helper Logic */
    const barData = useMemo(() => ({
        labels: collegeStats.branches,
        datasets: [{
            label: 'Avg CIE Performance (%)',
            data: collegeStats.branchPerformance,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderRadius: 6
        }]
    }), []);

    const handleDeptClick = useCallback((dept) => {
        setSelectedDept(dept);
        const students = getStudentsByDept(dept.id);
        setDeptStudents(students);
    }, []);

    const handleAddFaculty = useCallback(() => setActiveModal('faculty'), []);
    const handleNewBroadcast = useCallback(() => setActiveModal('broadcast'), []);
    const handleViewGrievance = useCallback((g) => {
        setSelectedItem(g);
        setActiveModal('grievance');
    }, []);

    return (
        <DashboardLayout menuItems={menuItems}>
            <div style={{ padding: '0' }}>
                <header className={styles.header}>
                    <div className={styles.welcomeText}>
                        <h1>Hello, Dr. Gowri Shankar</h1>
                        <p>Principal | Sanjay Gandhi Polytechnic</p>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => alert("Downloading Full Institute Report...")}
                            style={{ padding: '0.5rem', marginRight: '0.5rem', border: 'none', background: '#ecfdf5', color: '#059669', borderRadius: '8px', cursor: 'pointer' }}
                            title="Download Full Report"
                        >
                            <FileText size={20} />
                        </button>
                        <StudentSentinel />
                        <select className={styles.yearSelector}>
                            <option>Academic Year 2025-26</option>
                            <option>Academic Year 2024-25</option>
                        </select>
                    </div>
                </header>

                {/* Dynamic Content */}
                <div className={styles.sectionVisible}>
                    {activeTab === 'overview' && <OverviewSection barData={barData} />}

                    {activeTab === 'compliance' && <ComplianceSection />}

                    {activeTab === 'directory' && <DirectorySection
                        selectedDept={selectedDept}
                        deptStudents={deptStudents}
                        handleDeptClick={handleDeptClick}
                        setSelectedDept={setSelectedDept}
                        setSelectedStudentProfile={setSelectedStudentProfile}
                    />}

                    {activeTab === 'faculty' && <FacultyDirectorySection onAdd={handleAddFaculty} />}
                    {activeTab === 'timetables' && <TimetablesSection onDownload={handleDownload} />}
                    {activeTab === 'circulars' && <CircularsSection onNewBroadcast={handleNewBroadcast} />}
                    {activeTab === 'reports' && <ReportsSection onDownload={handleDownload} />}
                    {activeTab === 'grievances' && <GrievancesSection onView={handleViewGrievance} />}
                </div>
            </div>

            {/* Interaction Modals */}
            <ToastNotification show={toast.show} msg={toast.msg} type={toast.type} />

            <SimpleModal isOpen={activeModal === 'faculty'} onClose={() => setActiveModal(null)} title="Add New Faculty">
                <form onSubmit={handleSaveFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input className={styles.searchBarInput} placeholder="Full Name" required style={{ border: '1px solid #e2e8f0' }} />
                    <select className={styles.searchBarInput} style={{ border: '1px solid #e2e8f0' }}>
                        <option>Computer Science</option>
                        <option>Mechanical</option>
                        <option>Civil</option>
                    </select>
                    <input className={styles.searchBarInput} placeholder="Designation" required style={{ border: '1px solid #e2e8f0' }} />
                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>Save Faculty</button>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={activeModal === 'broadcast'} onClose={() => setActiveModal(null)} title="New Broadcast">
                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input className={styles.searchBarInput} placeholder="Circular Title" required style={{ border: '1px solid #e2e8f0' }} />
                    <textarea className={styles.notesArea} placeholder="Message content..." required style={{ border: '1px solid #e2e8f0', minHeight: '100px' }} />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', gap: '0.5rem' }}><input type="checkbox" /> Students</label>
                        <label style={{ display: 'flex', gap: '0.5rem' }}><input type="checkbox" defaultChecked /> Faculty</label>
                    </div>
                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '0.5rem', justifyContent: 'center', background: '#7c3aed' }}>Send Broadcast</button>
                </form>
            </SimpleModal>

            <SimpleModal isOpen={activeModal === 'grievance'} onClose={() => setActiveModal(null)} title="Grievance Details">
                {selectedItem && (
                    <div style={{ padding: '0.5rem 0' }}>
                        <p><strong>Student:</strong> {selectedItem.student}</p>
                        <p><strong>Issue:</strong> {selectedItem.issue}</p>
                        <p><strong>Date:</strong> {selectedItem.date}</p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button className={styles.primaryBtn} onClick={() => { setActiveModal(null); showToast('Marked as Resolved', 'success'); }}>Resolve</button>
                            <button className={styles.secondaryBtn} onClick={() => setActiveModal(null)}>Close</button>
                        </div>
                    </div>
                )}
            </SimpleModal>
        </DashboardLayout >
    );
};

export default PrincipalDashboard;
