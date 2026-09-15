import React, { useState, useEffect } from "react";

interface CustomerMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    custid: number;
    custname: string;
}

type Toast = { message: string; type: "success" | "error" } | null;

const GoCardlessMappingModal: React.FC<CustomerMappingModalProps> = ({
    isOpen,
    onClose,
    custid,
    custname
}) => {
    const [goCardlessId, setGoCardlessId] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [toast, setToast] = useState<Toast>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch existing mapping
    useEffect(() => {
        if (isOpen && custid) {
            setInitialLoading(true);
            fetch(`/api/gocardless/mapping?custid=${custid}`)
                .then(res => res.json())
                .then(data => {
                    if (data.gocardless_id) {
                        setGoCardlessId(data.gocardless_id);
                    }
                })
                .catch(err => console.error("Error fetching mapping:", err))
                .finally(() => setInitialLoading(false));
        } else {
            setGoCardlessId("");
        }
    }, [isOpen, custid]);

    const handleSave = async () => {
        setLoading(true);
        try {
            if (!goCardlessId.trim()) {
                // If empty, delete the mapping
                const res = await fetch(`/api/gocardless/mapping?custid=${custid}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error("Failed to remove mapping.");
                showToast('GoCardless mapping removed.', 'success');
            } else {
                // Save the mapping
                const res = await fetch(`/api/gocardless/mapping`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ custid, gocardless_id: goCardlessId.trim() })
                });
                if (!res.ok) throw new Error("Failed to save mapping.");
                showToast('GoCardless mapping saved.', 'success');
            }
            onClose();
        } catch (err: any) {
            showToast(err.message || 'An error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                    <span>{toast.type === 'success' ? '✓' : '✕'}</span>
                    <span>{toast.message}</span>
                </div>
            )}
            <div className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] flex items-center justify-center z-50">
                <div
                    className="bg-white dark:bg-gray-800 shadow-xl w-full max-w-md p-6 overflow-y-auto rounded-lg"
                    style={{ maxHeight: "90vh" }}
                >
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/[0.05] pb-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">GoCardless Mapping</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold dark:text-gray-400 dark:hover:text-white">
                            &times;
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-100 dark:border-gray-600">
                            Link customer <strong className="text-gray-900 dark:text-white">{custname}</strong> (ID: {custid}) to their GoCardless Customer ID to enable automatic payment syncing.
                        </div>

                        {initialLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                            </div>
                        ) : (
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    GoCardless Customer ID
                                </label>
                                <input
                                    type="text"
                                    value={goCardlessId}
                                    onChange={(e) => setGoCardlessId(e.target.value)}
                                    placeholder="e.g. CU000123... (Leave blank to remove)"
                                    className="w-full rounded-md border border-gray-300 shadow-sm p-2.5 text-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/[0.05] mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={loading || initialLoading}
                                className="px-6 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Mapping'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GoCardlessMappingModal;
