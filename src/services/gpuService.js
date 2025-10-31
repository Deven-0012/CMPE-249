import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GPU_COLLECTION } from '../constants';

// --- Seed GPUs (only when professor logs in) ---
export const seedInitialData = async () => {
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

