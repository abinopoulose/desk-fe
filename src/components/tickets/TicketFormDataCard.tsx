import React from 'react';

export interface TicketFormDataCardProps {
  formData?: Record<string, unknown>;
}

export const TicketFormDataCard: React.FC<TicketFormDataCardProps> = ({ formData = {} }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Ticket Details</h3>
      <div className="grid grid-cols-1 gap-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <dt className="text-sm font-medium text-gray-500 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {typeof value === 'boolean' ? (
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {value ? 'Yes' : 'No'}
                </span>
              ) : Array.isArray(value) ? (
                <ul className="list-disc pl-5">
                  {value.map((v, i) => (
                    <li key={i}>{String(v)}</li>
                  ))}
                </ul>
              ) : (
                String(value) || '-'
              )}
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
};
