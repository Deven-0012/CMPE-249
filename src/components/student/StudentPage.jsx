import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { GPU_COLLECTION, STUDENTS_COLLECTION } from '../../constants';
import { PageHeader } from '../common/PageHeader';
import { StudentUsageBar } from './StudentUsageBar';
import { GPUCard } from './GPUCard';
import { SSHModal } from './SSHModal';

// --- Student Page ---
export const StudentPage = ({ user }) => {
  const [gpus, setGpus] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [sshCommand, setSshCommand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Live GPUs
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, GPU_COLLECTION), (snapshot) => {
      const gpuData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setGpus(gpuData);
    });
    return () => unsubscribe();
  }, []);

  // Student doc (self-heal if missing)
  useEffect(() => {
    const docRef = doc(db, STUDENTS_COLLECTION, user.uid);
    const unsubscribe = onSnapshot(docRef, async (snap) => {
      if (snap.exists()) {
        setStudentData(snap.data());
        return;
      }
      try {
        const defaults = {
          uid: user.uid,
          name: user.displayName || 'Student',
          studentId: '',
          email: user.email,
          hasSshPermission: true,
          monthlyHourLimit: 10,
          totalUsageSeconds: 0,
        };
        await setDoc(docRef, defaults);
        setStudentData(defaults);
      } catch (e) {
        console.error('Failed to create student profile:', e);
      }
    });
    return () => unsubscribe();
  }, [user.uid, user.email, user.displayName]);

  const displayError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const isUserOnAnyGpu = () =>
    gpus.some(g => (g.users || []).some(u => u.id === user.uid));

  // Access: add current user with joinedAt and set startTime if needed
  const handleAccessGpu = async (gpu) => {
    if (!studentData) return;
    if (!studentData.hasSshPermission) return displayError("Your GPU access has been revoked by the professor.");
    if (studentData.totalUsageSeconds >= (studentData.monthlyHourLimit || 0) * 3600)
      return displayError("You have exceeded your monthly GPU quota.");
    if (isUserOnAnyGpu()) return displayError("You are already using a GPU.");

    const gpuRef = doc(db, GPU_COLLECTION, gpu.id);
    try {
      await updateDoc(gpuRef, {
        status: 'in-use',
        users: [{ id: user.uid, name: studentData.name || 'Student', joinedAt: serverTimestamp() }],
        startTime: serverTimestamp(),
      });
      setSshCommand(`ssh ${studentData.studentId || 'student'}@${gpu.ipAddress}`);
      setShowModal(true);
    } catch (err) {
      displayError(err.message);
    }
  };

  // Join: push current user with joinedAt
  const handleJoinGroup = async (gpu) => {
    if (!studentData) return;
    if (!studentData.hasSshPermission) return displayError("Your GPU access has been revoked by the professor.");
    if (studentData.totalUsageSeconds >= (studentData.monthlyHourLimit || 0) * 3600)
      return displayError("You have exceeded your monthly GPU quota.");
    if (isUserOnAnyGpu()) return displayError("You are already using a GPU.");

    const gpuRef = doc(db, GPU_COLLECTION, gpu.id);
    try {
      const updatedUsers = [...(gpu.users || []), { id: user.uid, name: studentData.name || 'Student', joinedAt: serverTimestamp() }];
      await updateDoc(gpuRef, { users: updatedUsers });
      setSshCommand(`ssh ${studentData.studentId || 'student'}@${gpu.ipAddress}`);
      setShowModal(true);
    } catch (err) {
      displayError(err.message);
    }
  };

  // Release: compute usage using per-user joinedAt (fallback to gpu.startTime)
  const handleReleaseGpu = async (gpu) => {
    if (!studentData) return;

    const currentUsers = gpu.users || [];
    const me = currentUsers.find(u => u.id === user.uid);
    if (!me) return displayError("You are not currently using this GPU.");

    const gpuRef = doc(db, GPU_COLLECTION, gpu.id);
    const updatedUsers = currentUsers.filter(u => u.id !== user.uid);

    try {
      // Compute my usage (now - joinedAt OR startTime)
      let joinDate = null;
      if (me.joinedAt && typeof me.joinedAt.toDate === 'function') {
        joinDate = me.joinedAt.toDate();
      } else if (gpu.startTime && typeof gpu.startTime.toDate === 'function') {
        joinDate = gpu.startTime.toDate();
      } else {
        joinDate = new Date();
      }
      const now = new Date();
      const myDurationSeconds = Math.max(0, (now - joinDate) / 1000);

      // Update ONLY my student doc (keeps rules happy)
      const myRef = doc(db, STUDENTS_COLLECTION, user.uid);
      const mySnap = await getDoc(myRef);
      const currentTotal = mySnap.exists() ? Number(mySnap.data().totalUsageSeconds || 0) : 0;
      await updateDoc(myRef, { totalUsageSeconds: currentTotal + myDurationSeconds });

      // Update GPU users; if none left, set available + clear startTime
      if (updatedUsers.length === 0) {
        await updateDoc(gpuRef, {
          status: 'available',
          users: [],
          startTime: null,
        });
      } else {
        await updateDoc(gpuRef, { users: updatedUsers });
      }
    } catch (err) {
      displayError(err.message);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {showModal && <SSHModal sshCommand={sshCommand} onClose={() => setShowModal(false)} />}
      <PageHeader userEmail={user.email} />
      <main className="container mx-auto p-6">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center font-semibold">
            {error}
          </div>
        )}
        {/* Pass props safely; works even if studentData is null */}
        <StudentUsageBar studentData={studentData} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gpus.map(gpu => (
            <GPUCard
              key={gpu.id}
              gpu={gpu}
              user={user}
              studentData={studentData}
              onAccess={handleAccessGpu}
              onJoin={handleJoinGroup}
              onRelease={handleReleaseGpu}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

