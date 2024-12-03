import React from 'react';

interface StatusOption {
  id: string;
  label: string;
  color: string;
}

const StatusFilter = ({ selectedStatuses, onChange, disabled }: {
  selectedStatuses: string[];
  onChange: (statuses: string[]) => void;
  disabled: boolean;
}) => {
  const statusOptions: StatusOption[] = [
    { id: 'Enviado', label: 'Enviado', color: 'bg-blue-500' },
    { id: 'Resolviendo', label: 'Resolviendo', color: 'bg-yellow-400' },
    { id: 'En pausa', label: 'En pausa', color: 'bg-orange-500' },
    { id: 'Postergado', label: 'Postergado', color: 'bg-purple-500' },
    { id: 'Sin resolver', label: 'Sin resolver', color: 'bg-red-500' },
    { id: 'Resuelto', label: 'Resuelto', color: 'bg-green-500' },
  ];

  const handleStatusChange = (statusId: string) => {
    if (selectedStatuses.includes(statusId)) {
      onChange(selectedStatuses.filter(id => id !== statusId));
    } else {
      onChange([...selectedStatuses, statusId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <span className="text-sm font-medium">Estados:</span>
      <div className="flex flex-wrap gap-3">
        {statusOptions.map((status) => (
          <label
            key={status.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status.id)}
                onChange={() => handleStatusChange(status.id)}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-offset-2 focus:ring-[#0078ba]"
                disabled={disabled}
              />
              <div className={`ml-2 w-3 h-3 rounded-full ${status.color}`} />
            </div>
            <span className="text-sm">{status.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default StatusFilter;