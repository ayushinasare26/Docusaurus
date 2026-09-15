import React from "react";

interface InfoItemData {
  label: string;
  value: React.ReactNode;
}

interface InfoSectionProps {
  title: string;
  items: InfoItemData[];
  // Grid columns count (default 2)
  columns?: number;
}

const InfoSection: React.FC<InfoSectionProps> = ({ title, items, columns = 2 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-white/[0.05] overflow-hidden">
      {/* Section header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
        <h4 className="text-sm font-medium uppercase text-gray-700 dark:text-gray-300">
          {title}
        </h4>
      </div>

      {/* Items grid */}
      <div className={`grid grid-cols-${columns} divide-x divide-y dark:divide-white/[0.05]`}>
        {items.map((item, idx) => (
          <div key={idx} className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {item.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoSection;
