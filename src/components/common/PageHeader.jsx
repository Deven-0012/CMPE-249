import { signOut } from "firebase/auth";
import { auth } from '../../config/firebase';

// --- Header ---
export const PageHeader = ({ userEmail }) => (
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

