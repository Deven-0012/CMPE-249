import { formatDuration } from '../../utils/formatDuration';

// Safe Usage Bar (works even if called with null/undefined props)
export const StudentUsageBar = (props = {}) => {
  const {
    totalUsageSeconds: pTotal = undefined,
    monthlyHourLimit: pLimit = undefined,
    hasSshPermission: pSsh = undefined,
    studentData = null,
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

