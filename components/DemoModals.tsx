import React, { useState } from 'react';

export const GoogleAuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" opacity="0.8" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" opacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="white" opacity="0.9" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <h2 className="text-xl font-bold">Google Account Access</h2>
          </div>
          <p className="text-sm text-blue-100">Sully.AI wants to access your Google Calendar</p>
        </div>

        {/* Account Selection */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 border-2 border-indigo-500 rounded-xl bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              JD
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">john.doe@company.com</p>
              <p className="text-xs text-gray-500">Default Account</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Requested Permissions</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">View and manage your calendar</p>
                  <p className="text-xs text-gray-500">Create events for qualified leads</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👥</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">View your contacts</p>
                  <p className="text-xs text-gray-500">Auto-populate lead information</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✉️</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Send emails on your behalf</p>
                  <p className="text-xs text-gray-500">Automated outreach campaigns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Demo Mode:</span> This is a simulated OAuth flow. No real Google account will be connected.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Deny
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition shadow-lg"
            >
              Allow Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CSVUploadModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setSelectedFile('leads_export_2026.csv');
  };

  const handleFileSelect = () => {
    setSelectedFile('my_contacts_list.csv');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <h2 className="text-xl font-bold">Import Leads from CSV</h2>
          </div>
          <p className="text-sm text-emerald-100">Upload your contact list to auto-populate the leads database</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Drag & Drop Area */}
          <div
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="font-bold text-gray-900 text-lg">{selectedFile}</p>
                <p className="text-sm text-gray-500">3,247 rows • 850 KB</p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">📁</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 mb-1">Drop your CSV file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <button
                  onClick={handleFileSelect}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"
                >
                  Select CSV File
                </button>
              </div>
            )}
          </div>

          {/* CSV Format Guide */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Required CSV Format</p>
            <div className="bg-white rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-200 shadow-sm">
              <div className="text-slate-400">name,email,company,title,phone,source</div>
              <div className="text-slate-700">John Doe,john@company.com,Tech Corp,CTO,+1234567890,LinkedIn</div>
              <div className="text-slate-700">Jane Smith,jane@startup.io,Startup Inc,CEO,+0987654321,Referral</div>
              <div className="text-slate-700">Mike Johnson,mike@enterprise.com,Big Co,VP Sales,+5551234567,Cold Email</div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              💡 <span className="font-semibold">Tip:</span> Columns can be in any order. Extra columns will be ignored.
            </p>
          </div>

          {/* Preview Section */}
          {selectedFile && (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Preview (First 3 Rows)</p>
              <div className="space-y-2">
                {['John Doe - Tech Corp (CTO)', 'Jane Smith - Startup Inc (CEO)', 'Mike Johnson - Big Co (VP Sales)'].map((row, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg text-sm text-gray-700 border border-blue-100">
                    ✓ {row}
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600">+ 3,244 more contacts ready to import</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Demo Mode:</span> This is a UI demonstration. No file will actually be uploaded or processed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedFile) {
                  alert(`✅ Successfully imported ${selectedFile}!\n\n3,247 leads added to your workspace.\n\nThis is a demo - no real data was imported.`);
                  onClose();
                } else {
                  alert('Please select a CSV file first');
                }
              }}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition shadow-lg ${
                selectedFile
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!selectedFile}
            >
              Import Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DemoModalsButton = () => {
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          onClick={() => setShowGoogleAuth(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-xl hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>🔐</span> Demo: Google Auth
        </button>
        <button
          onClick={() => setShowCSVUpload(true)}
          className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-xl hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <span>📊</span> Demo: CSV Upload
        </button>
      </div>

      <GoogleAuthModal isOpen={showGoogleAuth} onClose={() => setShowGoogleAuth(false)} />
      <CSVUploadModal isOpen={showCSVUpload} onClose={() => setShowCSVUpload(false)} />
    </>
  );
};
