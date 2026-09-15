"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronDown } from "lucide-react";

interface GroupOption {
  label: string;
  value: string;
}

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

type PackageFormState = {
  packageName: string;
  createDate: string;
  comments: string;
  groupcodes: GroupOption[];
};

const AddPackageModal: React.FC<AddPackageModalProps> = ({
  isOpen,
  onClose,
  onAdded,
}) => {
  const initialFormState: PackageFormState = {
    packageName: "",
    createDate: "",
    comments: "",
    groupcodes: [],
  };

  const [formData, setFormData] = useState<PackageFormState>(initialFormState);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch group codes from backend API on modal open
  useEffect(() => {
    async function fetchGroupCodes() {
      try {
        const res = await fetch("/api/packagegroups/groupcodes");
        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`);
        }
        const data: GroupOption[] = await res.json();
        setGroupOptions(data);
      } catch (err) {
        console.error("Error fetching group codes:", err);
      }
    }

    if (isOpen) {
      fetchGroupCodes();
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      createDate: date ? date.toISOString() : "",
    }));
  };

  const handleGroupCodeSelect = (groupCode: GroupOption) => {
    setFormData((prev) => {
      const alreadySelected = prev.groupcodes.some((g) => g.value === groupCode.value);
      const nextCodes = alreadySelected
        ? prev.groupcodes.filter((g) => g.value !== groupCode.value)
        : [...prev.groupcodes, groupCode];
      return { ...prev, groupcodes: nextCodes };
    });
  };

  const handleRemoveGroupCode = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      groupcodes: prev.groupcodes.filter((g) => g.value !== value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const mappedData = {
      packagename: formData.packageName,
      createdate: formData.createDate
        ? formData.createDate.split("T")[0]
        : null,
      comments: formData.comments,
      isdeleted: 0,
      groupcodes: formData.groupcodes.map((g) => g.value),
    };

    try {
      const response = await fetch("/api/packagegroups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mappedData),
      });

      if (response.ok) {
        setFormData(initialFormState); // Reset form
        onClose();
        if (onAdded) onAdded();
      } else {
        console.error("Failed to add package");
      }
    } catch (error) {
      console.error("Error adding package:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
      <div
        className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-2xl p-6 overflow-visible rounded-lg relative"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Add New Package
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-visible">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border">
            <h3 className="text-md font-semibold mb-4 text-gray-800 dark:text-white">
              Package Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="packageName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Package Name
                </label>
                <input
                  type="text"
                  id="packageName"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="createDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Create Date
                </label>
                <DatePicker
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  selected={formData.createDate ? new Date(formData.createDate) : null}
                  onChange={handleDateChange}
                  dateFormat={"dd/MM/yyyy"}
                  placeholderText="Select a date"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Code
                </label>
                
                {/* Selected Group Code Display */}
                {formData.groupcodes.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-md flex flex-wrap gap-2">
                    {formData.groupcodes.map((code) => (
                      <span key={code.value} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                        {code.label}
                        <button
                          type="button"
                          onClick={() => handleRemoveGroupCode(code.value)}
                          className="ml-2 hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown for Selecting Group Code */}
                <div className="relative">
                  <button
                    type="button"
                    className="dropdown-toggle w-full justify-between h-11 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {formData.groupcodes.length > 0 
                        ? `Selected (${formData.groupcodes.length})` 
                        : "Select Group Code(s)"
                      }
                    </span>
                    <ChevronDown 
                      className={`h-4 w-4 opacity-50 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  <Dropdown
                    isOpen={isDropdownOpen}
                    onClose={() => setIsDropdownOpen(false)}
                    className="w-full min-w-[400px] max-h-60 overflow-y-auto z-[60] left-0"
                  >
                    {groupOptions.map((option) => (
                      <DropdownItem
                        key={option.value}
                        onClick={() => handleGroupCodeSelect(option)}
                        className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer transition-colors ${
                          formData.groupcodes.some((g) => g.value === option.value) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <span className="font-medium flex items-center justify-between w-full">
                          {option.label}
                          {formData.groupcodes.some((g) => g.value === option.value) && (
                            <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                          )}
                        </span>
                      </DropdownItem>
                    ))}
                    {groupOptions.length === 0 && (
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-sm">
                        No group codes available
                      </div>
                    )}
                  </Dropdown>
                </div>
              </div>

              {/* <div className="md:col-span-2">
                <label
                  htmlFor="comments"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Comments (Optional)
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any additional comments..."
                />
              </div> */}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm transition-colors"
            >
              Add Package
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPackageModal;