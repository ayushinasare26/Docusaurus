'use client';

import React, { useState } from "react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown"; // adjust path
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

interface SearchField {
  label: string;
  value: string;
}

interface SearchDropdownProps {
  fields: SearchField[];
  activeField: string;
  onChange: (field: string) => void;
  labelPrefix?: string; // new optional prop
  className?: string; // optional className prop for custom styling
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  fields,
  activeField,
  onChange,
  labelPrefix = "Search",
  className


}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    onChange(value);
    setOpen(false);
  };

return (
  <div className={`relative inline-block ${className ?? ""}`}> 
    {/* Toggle Button */}
    <button
      onClick={() => setOpen(!open)}
      className="dropdown-toggle px-4 py-2 text-sm font-medium border rounded-md bg-white text-gray-700 hover:bg-gray-100 w-full flex justify-between"
    >
      {labelPrefix}: {fields.find((f) => f.value === activeField)?.label ?? "Select"}
    </button>

    {/* Dropdown */}
    <Dropdown isOpen={open} onClose={() => setOpen(false)}>
      {fields.map((field) => (
        <DropdownItem
          key={field.value}
          onClick={() => handleSelect(field.value)}
        >
          {field.label}
        </DropdownItem>
      ))}
    </Dropdown>
  </div>
);
}