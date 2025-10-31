// App.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDD97nk7cZ8zcBcF_LWcLp7rtXIyQ7el78",
  authDomain: "gpu-7ee7b.firebaseapp.com",
  projectId: "gpu-7ee7b",
  storageBucket: "gpu-7ee7b.firebasestorage.app",
  messagingSenderId: "133340030065",
  appId: "1:133340030065:web:578a0af04c3bfb22c4a7d0",
  measurementId: "G-HWLCC2V7GX"
};

// --- Professor's Email (MUST match in Firestore rules too) ---
const PROFESSOR_EMAIL = "kaikai.liu@sjsu.edu";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Collections ---
const GPU_COLLECTION = 'gpus';
const STUDENTS_COLLECTION = 'students';

// --- Helpers ---
const formatDuration = (secondsRaw) => {
  const seconds = Math.max(0, Number(secondsRaw || 0));
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// --- Seed GPUs (only when professor logs in) ---
const seedInitialData = async () => {
  const gpuSnapshot = await getDocs(collection(db, GPU_COLLECTION));
  if (gpuSnapshot.empty) {
    const gpus = [
      { id: 'gpu-0', name: 'NVIDIA RTX 4090',        status: 'available', users: [], startTime: null, ipAddress: '192.168.1.100' },
      { id: 'gpu-1', name: 'NVIDIA RTX 4080',        status: 'available', users: [], startTime: null, ipAddress: '192.168.1.101' },
      { id: 'gpu-2', name: 'AMD Radeon RX 7900 XTX', status: 'available', users: [], startTime: null, ipAddress: '192.168.1.102' },
      { id: 'gpu-3', name: 'NVIDIA RTX 3070 Ti',     status: 'available', users: [], startTime: null, ipAddress: '192.168.1.103' },
    ];
    await Promise.all(gpus.map(gpu => setDoc(doc(db, GPU_COLLECTION, gpu.id), gpu)));
  }
};

// --- App (Routing) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading GPU Hub...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return user.email === PROFESSOR_EMAIL
    ? <ProfessorPage user={user} />
    : <StudentPage user={user} />;
}

// --- Auth Page ---
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProfessorEmail = email.trim().toLowerCase() === PROFESSOR_EMAIL;

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      }

      // Registration
      if (!isProfessorEmail && (!name.trim() || !studentId.trim())) {
        setError("Please fill out Full Name and Student ID.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      if (!isProfessorEmail) {
        await setDoc(doc(db, STUDENTS_COLLECTION, newUser.uid), {
          uid: newUser.uid,
          name: name.trim(),
          studentId: studentId.trim(),
          email: newUser.email,
          hasSshPermission: true,
          monthlyHourLimit: 10,
          totalUsageSeconds: 0
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? 'SJSU GPU Hub Login' : 'Create Account'}
        </h2>
        <form onSubmit={handleAuthAction}>
          {!isLogin && !isProfessorEmail && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">Full Name</label>
                <input
                  type="text" id="name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alice Johnson"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="studentId">Student ID</label>
                <input
                  type="text" id="studentId" value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="012345678"
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Email Address</label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="student@sjsu.edu"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="w-full mt-4 text-center text-sm text-blue-600 hover:underline"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
};

// --- Header ---
const PageHeader = ({ userEmail }) => (
  <header className="bg-gray-800 text-white p-4 shadow-lg">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold">SJSU GPU Hub</h1>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Logged in as: {userEmail}</span>
        <button
          onClick={() => signOut(auth)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
);

// --- Student Page ---
const StudentPage = ({ user }) => {
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

  // Safe Usage Bar (works even if called with null/undefined props)
  const StudentUsageBar = (props = {}) => {
    const {
      totalUsageSeconds: pTotal = undefined,
      monthlyHourLimit: pLimit = undefined,
      hasSshPermission: pSsh = undefined,
    } = props || {};

    const totalUsageSeconds = pTotal ?? Number(studentData?.totalUsageSeconds || 0);
    const monthlyHourLimit  = pLimit ?? Number(studentData?.monthlyHourLimit  || 0);
    const hasSshPermission  = pSsh  ?? (studentData?.hasSshPermission ?? true);

    const ready = Number.isFinite(totalUsageSeconds) && Number.isFinite(monthlyHourLimit);

    if (!ready) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="h-4 bg-gray-200 rounded-full animate-pulse" />
          <p className="text-xs text-gray-500 mt-2">Setting up your profile…</p>
        </div>
      );
    }

    const totalLimitSeconds = monthlyHourLimit * 3600;
    const percentage = totalLimitSeconds > 0 ? (totalUsageSeconds / totalLimitSeconds) * 100 : 0;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-700">My Monthly Usage</h3>
          <span className="text-sm font-bold text-gray-800">
            {formatDuration(totalUsageSeconds)} / {monthlyHourLimit} hrs
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        {hasSshPermission === false && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 font-semibold text-center rounded-lg">
            Your SSH Permission has been revoked. Please contact your professor.
          </div>
        )}
      </div>
    );
  };

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Access GPU via SSH</h3>
        <p className="text-gray-600 mb-6">Open your terminal and run the following command:</p>
        <div className="bg-gray-900 text-green-400 font-mono p-4 rounded-md mb-6 text-left break-all">
          {sshCommand}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(sshCommand)}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition w-1/2 mr-2"
        >
          Copy Command
        </button>
        <button
          onClick={() => setShowModal(false)}
          className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition w-1/3"
        >
          Close
        </button>
      </div>
    </div>
  );

  const GPUCard = ({ gpu }) => {
    const isAvailable = (gpu?.status || 'available') === 'available';
    const isCurrentUserUsingThis = (gpu?.users || []).some(u => u.id === user.uid);
    const hasStudent = !!studentData;

    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition transform hover:-translate-y-1 ${isAvailable ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800">{gpu.name}</h3>
          <p className={`text-sm font-semibold mt-1 ${isAvailable ? 'text-green-600' : 'text-yellow-600'}`}>
            Status: {gpu.status?.charAt(0).toUpperCase() + gpu.status?.slice(1)}
          </p>
          <div className="mt-4 min-h-[60px]">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Users</h4>
            {(gpu.users || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(gpu.users || []).map(u => (
                  <span key={u.id} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    {u.name}
                  </span>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">No one is using this GPU.</p>}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {isAvailable && (
              <button
                disabled={!hasStudent}
                onClick={() => hasStudent && handleAccessGpu(gpu)}
                className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                Access GPU
              </button>
            )}
            {!isAvailable && !isCurrentUserUsingThis && (
              <button
                disabled={!hasStudent}
                onClick={() => hasStudent && handleJoinGroup(gpu)}
                className="flex-1 bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition disabled:opacity-60"
              >
                Join Group
              </button>
            )}
            {isCurrentUserUsingThis && (
              <button
                onClick={() => handleReleaseGpu(gpu)}
                className="flex-1 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition"
              >
                Release GPU
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {showModal && <Modal />}
      <PageHeader userEmail={user.email} />
      <main className="container mx-auto p-6">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center font-semibold">
            {error}
          </div>
        )}
        {/* Pass props safely; works even if studentData is null */}
        <StudentUsageBar {...(studentData ?? {})} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gpus.map(gpu => <GPUCard key={gpu.id} gpu={gpu} />)}
        </div>
      </main>
    </div>
  );
};

// --- Professor Page ---
const ProfessorPage = ({ user }) => {
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

// --- Manage Student Modal ---
const ManageStudentModal = ({ student, onClose, onSave }) => {
  const [hourLimit, setHourLimit] = useState(Number(student?.monthlyHourLimit || 0));
  const [hasSshPermission, setHasSshPermission] = useState(!!student?.hasSshPermission);

  const handleSaveClick = () => {
    onSave({
      monthlyHourLimit: Number(hourLimit || 0),
      hasSshPermission
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Manage Student: {student?.name || 'Student'}</h3>

        <div className="mb-6">
          <label htmlFor="hourLimit" className="block text-sm font-medium text-gray-700 mb-2">
            Monthly GPU Hour Limit
          </label>
          <input
            type="number" id="hourLimit" value={hourLimit}
            onChange={(e) => setHourLimit(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 10"
          />
        </div>

        <div className="mb-8">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={hasSshPermission}
              onChange={(e) => setHasSshPermission(e.target.checked)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">Grant SSH Permission</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            If unchecked, this student will not be able to access or join any GPUs.
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
