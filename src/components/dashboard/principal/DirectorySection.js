import React, { useState, useMemo, memo } from 'react';
import { X } from 'lucide-react';
import styles from '../../../pages/PrincipalDashboard.module.css';
import { departments } from '../../../utils/mockData';

const StudentProfileModal = ({ selectedStudentProfile, setSelectedStudentProfile, selectedDept }) => {
    if (!selectedStudentProfile) return null;
    const s = selectedStudentProfile;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedStudentProfile(null)}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px',
                padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setSelectedStudentProfile(null)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <X size={24} color="#64748b" />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#e0f2fe', color: '#0369a1',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 1rem'
                    }}>
                        {s.name.charAt(0)}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>{s.name}</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>{s.rollNo} | {selectedDept?.name} | {s.sem} Sem</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className={styles.glassCard} style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.9rem' }}>Academic Performance</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>IA-1</span>
                            <span>{s.marks.ia1}/20</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>IA-2</span>
                            <span>{s.marks.ia2}/20</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                            <span>Total</span>
                            <span>{s.marks.ia1 + s.marks.ia2}/40</span>
                        </div>
                    </div>
                    <div className={styles.glassCard} style={{ padding: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#64748b', fontSize: '0.9rem' }}>Attendance & Behavior</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span>Attendance</span>
                                <span style={{ fontWeight: 'bold', color: s.attendance < 75 ? '#dc2626' : '#16a34a' }}>{s.attendance}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                <div style={{ width: `${s.attendance}%`, height: '100%', background: s.attendance < 75 ? '#dc2626' : '#16a34a', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <div>
                            <span style={{ padding: '4px 8px', background: '#f0f9ff', color: '#0284c7', borderRadius: '4px', fontSize: '0.8rem' }}>Good Conduct</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.primaryBtn} onClick={() => alert('Report Generated')}>Download Report Card</button>
                    <button className={styles.secondaryBtn} onClick={() => alert('Contacting Parents...')}>Contact Parent</button>
                </div>
            </div>
        </div>
    );
};

export const DirectorySection = memo(({ selectedDept, deptStudents, handleDeptClick, setSelectedDept, setSelectedStudentProfile: propSetSelectedStudentProfile }) => {
    const [semester, setSemester] = useState('2nd');
    const [section, setSection] = useState('A');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Local state for modal to keep it self-contained or use prop if lifting state is needed
    // The prop is passed, so we use it. But we also need to render the modal here or in parent.
    // The original code passed `setSelectedStudentProfile` up.
    // We can keep rendering the modal in the parent or move it here. 
    // Moving it here is cleaner for "Section" encapsulation, 
    // but the original `PrincipalDashboard` had it at root level (better for z-index/overlay).
    // Let's keep the modal render in this component for simplicity of refactor,
    // assuming valid z-index context. 
    // Actually, `deptStudents` is passed from parent. `selectedStudentProfile` was state in parent.
    // We can use local state for the modal if we want to fully encapsulate. 
    // But `PrincipalDashboard` had `selectedStudentProfile` state.
    // Let's use the prop for setting, but we might need the object. 
    // The parent passed `setSelectedStudentProfile`. It did NOT pass `selectedStudentProfile` object to THIS component 
    // in the original code (it rendered Modal outside).
    // Let's change this: `DirectorySection` now handles the modal internally to reduce parent complexity.

    const [internalSelectedStudent, setInternalSelectedStudent] = useState(null);

    const handleViewProfile = (student) => {
        if (propSetSelectedStudentProfile) {
            propSetSelectedStudentProfile(student); // If parent wants to know
        }
        setInternalSelectedStudent(student);
    };

    // Helper to generate random students - Memoized to prevent regeneration on every render
    const randomStudents = useMemo(() => {
        if (semester === '2nd') return [];

        const count = 60;
        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Neerav', 'Rohan', 'Aryan', 'Dhruv', 'Kabir', 'Riyan', 'Ananya', 'Diya', 'Sana', 'Aaradhya', 'Kiara', 'Pari', 'Anika', 'Myra', 'Riya', 'Anya', 'Ahana', 'Kyra'];
        const lastNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhat', 'Saxena', 'Mehta', 'Joshi', 'Singh', 'Kumar', 'Reddy', 'Patel', 'Das', 'Roy', 'Nair', 'Rao', 'Iyer', 'Menon', 'Gowda', 'Shetty'];

        return Array.from({ length: count }, (_, i) => ({
            id: `RND${semester}${section}${i}`,
            rollNo: `459CS${25 - (parseInt(semester) || 1)}0${String(i + 1).padStart(2, '0')}`,
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            sem: semester,
            section: section,
            attendance: Math.floor(Math.random() * 30) + 70,
            marks: {
                ia1: Math.floor(Math.random() * 20),
                ia2: Math.floor(Math.random() * 20)
            }
        }));
    }, [semester, section]);

    // Derived State: Filtered Students - Memoized
    const filteredStudents = useMemo(() => {
        // Reset page on filter change
        setCurrentPage(1);
        if (semester === '2nd') {
            // Strict filtering for 2nd semester real/mock data
            return deptStudents.filter(s => s.section === section);
        } else {
            return randomStudents;
        }
    }, [semester, section, deptStudents, randomStudents]);

    // Pagination Logic
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(start, start + itemsPerPage);
    }, [currentPage, filteredStudents]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    if (!selectedDept) {
        return (
            <div className={styles.sectionVisible}>
                <h3 className={styles.chartTitle} style={{ marginBottom: '1.5rem' }}>Select Department</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {departments.map(dept => (
                        <div
                            key={dept.id}
                            className={styles.glassCard}
                            onClick={() => handleDeptClick(dept)}
                            style={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                borderLeft: `4px solid ${dept.id === 'CS' ? '#3b82f6' : dept.id === 'ME' ? '#f59e0b' : '#10b981'}`
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1.2rem', color: '#1e293b', margin: 0 }}>{dept.name}</h4>
                                <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{dept.id}</span>
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                <p>HOD: {dept.hod}</p>
                                <p>Total Students: {120}</p>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.9rem' }}>View Students →</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.sectionVisible}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setSelectedDept(null)}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                >← Back</button>

                <div style={{ marginRight: 'auto' }}>
                    <h3 className={styles.chartTitle} style={{ marginBottom: 0 }}>{selectedDept.name} Students</h3>
                    <p style={{ color: '#64748b', margin: 0 }}>Total Records: {filteredStudents.length}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    >
                        {['1st', '2nd', '3rd', '4th', '5th'].map(sem => (
                            <option key={sem} value={sem}>{sem} Semester</option>
                        ))}
                    </select>

                    <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Reg No</th>
                            <th>Name</th>
                            <th>Sem</th>
                            <th>Section</th>
                            <th>Attendance</th>
                            <th>IA Performance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedStudents.length > 0 ? (
                            paginatedStudents.map(student => (
                                <tr key={student.id} onClick={() => handleViewProfile(student)} style={{ cursor: 'pointer' }}>
                                    <td>{student.rollNo}</td>
                                    <td style={{ fontWeight: 600 }}>{student.name}</td>
                                    <td>{student.sem}</td>
                                    <td>{student.section}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem',
                                            background: student.attendance >= 75 ? '#dcfce7' : '#fee2e2',
                                            color: student.attendance >= 75 ? '#166534' : '#991b1b'
                                        }}>
                                            {student.attendance}%
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ width: '100px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${(student.marks.ia1 + student.marks.ia2) / 40 * 100}%`,
                                                height: '100%',
                                                background: '#3b82f6'
                                            }}></div>
                                        </div>
                                    </td>
                                    <td>
                                        <button className={styles.secondaryBtn} onClick={(e) => { e.stopPropagation(); handleViewProfile(student); }}>
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                    No students found for {semester} Sem - Section {section}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Previous
                        </button>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <StudentProfileModal
                selectedStudentProfile={internalSelectedStudent}
                setSelectedStudentProfile={setInternalSelectedStudent}
                selectedDept={selectedDept}
            />
        </div>
    );
});
