import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { GPU_COLLECTION, STUDENTS_COLLECTION } from '../../constants';
import { formatDuration } from '../../utils/formatDuration';
import { seedInitialData } from '../../services/gpuService';
import { PageHeader } from '../common/PageHeader';
import { ManageStudentModal } from './ManageStudentModal';

// --- Professor Page ---
export const ProfessorPage = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [gpus, setGpus] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Seed & subscribe
  useEffect(() => {
    seedInitialData().catch(console.error);
    const unsubscribe = onSnapshot(collection(db, STUDENTS_COLLECTION), (snapshot) => {
      const studentData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(studentData);
    });
    return () => unsubscribe();
  }, []);

  // GPUs live updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, GPU_COLLECTION), (snapshot) => {
      const gpuData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGpus(gpuData);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSaveChanges = async (updatedData) => {
    if (!selectedStudent) return;
    const studentRef = doc(db, STUDENTS_COLLECTION, selectedStudent.id);
    try {
      await updateDoc(studentRef, updatedData);
      handleCloseModal();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <PageHeader userEmail={user.email} />
      {isModalOpen && (
        <ManageStudentModal
          student={selectedStudent}
          onClose={handleCloseModal}
          onSave={handleSaveChanges}
        />
      )}
      <main className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Professor Dashboard</h2>

        {/* GPU Overview */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Live GPU Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gpus.map(gpu => (
              <div key={gpu.id} className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-bold text-gray-800">{gpu.name}</h4>
                <p className={`text-sm font-semibold ${gpu.status === 'available' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {gpu.status}
                </p>
                <div className="text-xs mt-2">
                  {(gpu.users || []).length > 0 ? (
                    (gpu.users || []).map(u => u.name).join(', ')
                  ) : (
                    <span className="text-gray-500">Idle</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Student Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hour Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SSH Permission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students
                  .slice()
                  .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                  .map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name || 'Student'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDuration(student.totalUsageSeconds || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(student.monthlyHourLimit || 0)} hrs</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.hasSshPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {student.hasSshPermission ? 'Granted' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenModal(student)}
                          className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-xs hover:bg-blue-600 transition"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

