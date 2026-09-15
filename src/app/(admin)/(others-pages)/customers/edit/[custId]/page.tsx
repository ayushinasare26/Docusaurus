'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Save, X } from 'lucide-react';
import { usePageHeading } from '@/context/PageHeadingContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CreditCard } from 'lucide-react';

type Customer = {
  custid: number;
  serverid: number;
  cardid: number;
  custname: string;
  addressline1: string;
  addressline2: string;
  addressline3: string;
  city: string;
  pincode: string;
  joindate: string | null;
  invemailto: string | null;
  invemailcc: string | null;
  coremailto: string | null;
  coremailcc: string | null;
  contactmain1: string | null;
  contactmain2: string | null;
  contactperson1: string | null;
  contactno1: string | null;
  contactperson2: string | null;
  contactno2: string | null;
  contactperson3: string | null;
  contactno3: string | null;
  contactperson4: string | null;
  contactno4: string | null;
  isdeleted: number;
  discount: number;
  comments: string | null;
  creditlimit: number;
  overlimitmessage: string | null;
  isdistributor: number;
  isSuspended: number;
  providerid: number;
  ddtrefno: string | null;
  vat: number;
  rental_comission: number;
  call_comission: number;
  billtype: number;
};

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeading } = usePageHeading();
  const custId = params.custId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GoCardless mapping state
  const [goCardlessId, setGoCardlessId] = useState('');
  const [gcLoading, setGcLoading] = useState(true);
  const [gcSaving, setGcSaving] = useState(false);
  const [gcMessage, setGcMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setHeading('Edit Customer');
  }, [setHeading]);

  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/${custId}`);
        if (!response.ok) throw new Error('Customer not found');
        const data = await response.json();
        setCustomer(data);
        setFormData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      } finally {
        setLoading(false);
      }
    };

    if (custId) {
      fetchCustomer();
    }
  }, [custId]);

  // Fetch GoCardless mapping
  useEffect(() => {
    if (!custId) return;
    setGcLoading(true);
    fetch(`/api/gocardless/mapping?custid=${custId}`)
      .then(res => res.json())
      .then(data => {
        if (data.gocardless_id) setGoCardlessId(data.gocardless_id);
      })
      .catch(() => {})
      .finally(() => setGcLoading(false));
  }, [custId]);

  const handleGoCardlessSave = async () => {
    setGcSaving(true);
    setGcMessage(null);
    try {
      if (!goCardlessId.trim()) {
        const res = await fetch(`/api/gocardless/mapping?custid=${custId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to remove mapping.');
        setGcMessage({ text: 'GoCardless mapping removed.', type: 'success' });
      } else {
        const res = await fetch('/api/gocardless/mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custid: Number(custId), gocardless_id: goCardlessId.trim() })
        });
        if (!res.ok) throw new Error('Failed to save mapping.');
        setGcMessage({ text: 'GoCardless mapping saved.', type: 'success' });
      }
    } catch (err: any) {
      setGcMessage({ text: err.message || 'An error occurred.', type: 'error' });
    } finally {
      setGcSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  const handleDateChange = (date: Date | null, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.toISOString().split('T')[0] : null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${custId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update customer');
      }

      router.push('/customers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-white/[0.03] dark:text-gray-200 dark:border-white/[0.1] dark:focus:ring-indigo-400";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="container mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
        <button
          onClick={() => router.push('/customers')}
          className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Edit: {customer?.custname}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customer ID: {customer?.custid}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">

          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClassName}>Customer Name *</label>
                <input
                  type="text"
                  name="custname"
                  value={formData.custname || ''}
                  onChange={handleChange}
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <label className={labelClassName}>Joining Date</label>
                <DatePicker
                  selected={formData.joindate ? new Date(formData.joindate) : null}
                  onChange={(date) => handleDateChange(date, 'joindate')}
                  className={inputClassName}
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div>
                <label className={labelClassName}>Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClassName}>Provider ID</label>
                <input
                  type="number"
                  name="providerid"
                  value={formData.providerid ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Address Line 1</label>
                <input
                  type="text"
                  name="addressline1"
                  value={formData.addressline1 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Address Line 2</label>
                <input
                  type="text"
                  name="addressline2"
                  value={formData.addressline2 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Address Line 3</label>
                <input
                  type="text"
                  name="addressline3"
                  value={formData.addressline3 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClassName}>General Contact Line 1</label>
                <input
                  type="text"
                  name="contactmain1"
                  value={formData.contactmain1 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>General Contact Line 2</label>
                <input
                  type="text"
                  name="contactmain2"
                  value={formData.contactmain2 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Contact Persons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-2">
                  <label className={labelClassName}>Contact Person {num}</label>
                  <input
                    type="text"
                    name={`contactperson${num}`}
                    value={(formData as Record<string, any>)[`contactperson${num}`] || ''}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    name={`contactno${num}`}
                    value={(formData as Record<string, any>)[`contactno${num}`] || ''}
                    onChange={handleChange}
                    className={inputClassName}
                    placeholder="Phone"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Email Settings */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Email Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Invoice Email To</label>
                <input
                  type="email"
                  name="invemailto"
                  value={formData.invemailto || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Invoice Email CC</label>
                <input
                  type="email"
                  name="invemailcc"
                  value={formData.invemailcc || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Correspondence Email To</label>
                <input
                  type="email"
                  name="coremailto"
                  value={formData.coremailto || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Correspondence Email CC</label>
                <input
                  type="email"
                  name="coremailcc"
                  value={formData.coremailcc || ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          {/* Billing & Status */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Billing & Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={labelClassName}>Direct Debit Reference Number</label>
                <input
                  type="number"
                  name="ddtrefno"
                  value={formData.ddtrefno ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder={customer?.ddtrefno == null ? 'Enter direct debit reference number' : ''}
                />
                {customer?.ddtrefno == null && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This customer currently has no direct debit reference number.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClassName}>VAT (%)</label>
                <input
                  type="number"
                  name="vat"
                  value={formData.vat ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClassName}>Credit Limit</label>
                <input
                  type="number"
                  name="creditlimit"
                  value={formData.creditlimit ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Rental Commission (%)</label>
                <input
                  type="number"
                  name="rental_comission"
                  value={formData.rental_comission ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClassName}>Call Commission (%)</label>
                <input
                  type="number"
                  name="call_comission"
                  value={formData.call_comission ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClassName}>Pulse Rate (BillType)</label>
                <input
                  type="number"
                  name="billtype"
                  value={formData.billtype ?? ''}
                  onChange={handleChange}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isSuspended"
                  checked={formData.isSuspended === 1}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Suspended</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isdeleted"
                  checked={formData.isdeleted === 1}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Deleted</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isdistributor"
                  checked={formData.isdistributor === 1}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Distributor</span>
              </label>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1]">
              Additional Information
            </h3>
            <div>
              <label className={labelClassName}>Comments</label>
              <textarea
                name="comments"
                value={formData.comments || ''}
                onChange={handleChange}
                className={`${inputClassName} min-h-[100px]`}
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/[0.1]">
            <button
              type="button"
              onClick={() => router.push('/customers')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-300 dark:border-white/[0.1] dark:hover:bg-white/[0.05]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* GoCardless Section */}
      <div className="mt-6 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
        <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-white/[0.1] flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-purple-600" />
          GoCardless Mapping
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-100 dark:border-gray-600 mb-4">
          Link this customer to their GoCardless Customer ID to enable automatic payment syncing.
        </div>
        {gcLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className={labelClassName}>GoCardless Customer ID</label>
              <input
                type="text"
                value={goCardlessId}
                onChange={(e) => setGoCardlessId(e.target.value)}
                placeholder="e.g. CU000123... (Leave blank to remove)"
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={handleGoCardlessSave}
              disabled={gcSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Save className="h-4 w-4 mr-2" />
              {gcSaving ? 'Saving...' : 'Update GoCardless'}
            </button>
          </div>
        )}
        {gcMessage && (
          <div className={`mt-3 text-sm p-3 rounded ${gcMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {gcMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
