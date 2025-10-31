// GPU Card Component
export const GPUCard = ({ gpu, user, studentData, onAccess, onJoin, onRelease }) => {
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
              onClick={() => hasStudent && onAccess(gpu)}
              className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              Access GPU
            </button>
          )}
          {!isAvailable && !isCurrentUserUsingThis && (
            <button
              disabled={!hasStudent}
              onClick={() => hasStudent && onJoin(gpu)}
              className="flex-1 bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-600 transition disabled:opacity-60"
            >
              Join Group
            </button>
          )}
          {isCurrentUserUsingThis && (
            <button
              onClick={() => onRelease(gpu)}
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

