import React, { useState, useRef, useEffect } from "react";
import Input from "./input/InputField";

interface Option {
    value: string | number;
    label: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Search...",
    label,
    className = "",
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the label for the current value
    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : "";

    // Filter options based on search term
    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.value.toString().includes(searchTerm)
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    {label}
                </label>
            )}
            <div className="relative">
                <div
                    className={`relative flex items-center h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-4 pr-10 text-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-primary-500 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        }`}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                >
                    <span className={`block truncate ${!selectedOption ? "text-gray-400" : "text-gray-800 dark:text-gray-200"}`}>
                        {displayValue || placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </span>
                </div>

                {isOpen && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-900">
                        <div className="sticky top-0 bg-white px-2 py-1 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                            <input
                                type="text"
                                autoFocus
                                className="w-full border-none p-2 text-sm focus:ring-0 dark:bg-gray-900 dark:text-white"
                                placeholder="Type to filter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-primary-50 dark:hover:bg-primary-900/20 ${option.value === value ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-semibold" : "text-gray-900 dark:text-gray-100"
                                        }`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span className="block truncate">{option.label}</span>
                                    {option.value === value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-2 pl-3 pr-9 text-gray-500 italic">No matches found</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;
