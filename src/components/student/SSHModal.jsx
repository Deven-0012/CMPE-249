// --- SSH Modal ---
export const SSHModal = ({ sshCommand, onClose }) => (
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
        onClick={onClose}
        className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition w-1/3"
      >
        Close
      </button>
    </div>
  </div>
);

