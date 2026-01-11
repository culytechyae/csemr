'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

interface HL7Message {
  id: string;
  messageType: string;
  messageControlId: string;
  status: string;
  sentAt?: string;
  errorMessage?: string;
  messageContent?: string;
  student?: {
    firstName: string;
    lastName: string;
    studentId: string;
  };
  school: {
    name: string;
  };
  visit?: {
    visitType: string;
  };
}

export default function HL7Page() {
  const [messages, setMessages] = useState<HL7Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [viewingMessage, setViewingMessage] = useState<HL7Message | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = () => {
    const url = filter ? `/api/hl7?status=${filter}` : '/api/hl7';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'ACKNOWLEDGED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const viewMessage = (message: HL7Message) => {
    if (!message.messageContent) {
      alert('Message content not available');
      return;
    }
    setViewingMessage(message);
    setShowModal(true);
  };

  const downloadMessage = (message: HL7Message) => {
    if (!message.messageContent) {
      alert('Message content not available');
      return;
    }

    // Create a blob with the HL7 message content
    const blob = new Blob([message.messageContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename: MESSAGE_TYPE_CONTROL_ID.hl7
    const filename = `${message.messageType}_${message.messageControlId}.hl7`;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Message content copied to clipboard');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HL7 Messages</h1>
        <p className="text-gray-600 mb-6">Monitor HL7 message transmission and status</p>

        <div className="mb-4 flex space-x-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === '' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('SENT')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'SENT' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter('FAILED')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'FAILED' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Failed
          </button>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {message.messageType} Message
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Control:</span>{' '}
                      <span className="text-gray-900">{message.messageControlId}</span>
                    </div>
                    {message.student && (
                      <div>
                        <span className="font-medium text-gray-700">Student:</span>{' '}
                        <span className="text-gray-900">
                          {message.student.firstName} {message.student.lastName} ({message.student.studentId})
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">School:</span>{' '}
                      <span className="text-gray-900">{message.school.name}</span>
                    </div>
                    {message.visit && (
                      <div>
                        <span className="font-medium text-gray-700">Visit Type:</span>{' '}
                        <span className="text-gray-900">{message.visit.visitType}</span>
                      </div>
                    )}
                    {message.sentAt && (
                      <div>
                        <span className="font-medium text-gray-700">Sent At:</span>{' '}
                        <span className="text-gray-900">{new Date(message.sentAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {message.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm font-medium text-red-800">Error:</div>
                      <div className="text-sm text-red-600 mt-1">{message.errorMessage}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => viewMessage(message)}
                    disabled={!message.messageContent}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="View HL7 message content"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  <button
                    onClick={() => downloadMessage(message)}
                    disabled={!message.messageContent}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Download HL7 message for validation"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center text-gray-500">No HL7 messages found</div>
            </div>
          )}
        </div>

        {/* View Message Modal */}
        {showModal && viewingMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {viewingMessage.messageType} Message
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Control ID: {viewingMessage.messageControlId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setViewingMessage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                {viewingMessage.messageContent ? (
                  <div className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => copyToClipboard(viewingMessage.messageContent || '')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={() => downloadMessage(viewingMessage)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                    <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap break-words">
                      {viewingMessage.messageContent}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Message content not available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

