import { useState } from 'react';

// --- Manage Student Modal ---
export const ManageStudentModal = ({ student, onClose, onSave }) => {
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

