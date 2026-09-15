'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { usePageHeading } from '@/context/PageHeadingContext';
import { useRouter, useSearchParams } from 'next/navigation';

type Customer = {
  custid: number;
  custname: string;
  isdeleted?: number;
};

type Product = {
  prodid: number;
  prodname: string;
  type?: number;
  isdeleted?: number;
};

type Country = {
  id: number;
  name: string;
  code?: string;
};

type DidFormState = {
  didno: string;
  custid: string;
  allocateddate: string;
  purchasedate: string;
  type: string;
  location: string;
  terminationno: string;
  in_ll_callcharge: string;
  in_m_callcharge: string;
  didlocation: string;
  countryid: string;
};

const locationOptions = [
  { label: 'Geographic', value: '1' },
  { label: 'Non Geographic', value: '2' },
  { label: 'Toll-Free', value: '3' },
];

function parseNumber(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AddDidClient() {
  const { setHeading } = usePageHeading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const didnoParam = searchParams.get('didno');
  const isEditMode = !!didnoParam;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didTypeMenuOpen, setDidTypeMenuOpen] = useState(false);
  const didTypeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const didTypeMenuRef = React.useRef<HTMLDivElement | null>(null);

  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const customerMenuRef = React.useRef<HTMLDivElement | null>(null);

  const initialCustId = searchParams.get('custid') || '0';

  const [form, setForm] = useState<DidFormState>({
    didno: didnoParam || '',
    custid: initialCustId,
    allocateddate: '',
    purchasedate: '',
    type: '',
    location: '1',
    terminationno: '',
    in_ll_callcharge: '0',
    in_m_callcharge: '0',
    didlocation: '',
    countryid: '',
  });

  useEffect(() => {
    setHeading(isEditMode ? 'Edit DID Number' : 'Add DID Number');
  }, [setHeading, isEditMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, countriesRes, customersRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/countries'),
          fetch('/api/customers'),
        ]);

        if (!productsRes.ok) {
          throw new Error('Failed to load DID types');
        }
        if (!countriesRes.ok) {
          throw new Error('Failed to load countries');
        }
        if (!customersRes.ok) {
          throw new Error('Failed to load customers');
        }

        const [productsJson, countriesJson, customersJson] = await Promise.all([
          productsRes.json(),
          countriesRes.json(),
          customersRes.json(),
        ]);

        setProducts(productsJson || []);
        setCountries(countriesJson || []);
        setCustomers(customersJson || []);

        let loadedDid = null;
        if (didnoParam) {
          const didRes = await fetch(`/api/dids?searchby=didno&searchtext=${didnoParam}`);
          if (didRes.ok) {
            const didsJson = await didRes.json();
            if (Array.isArray(didsJson) && didsJson.length > 0) {
              loadedDid = didsJson[0];
            }
          }
        }

        if (loadedDid) {
          setForm({
            didno: String(loadedDid.didno),
            custid: String(loadedDid.custid ?? '0'),
            allocateddate: loadedDid.allocateddate ? loadedDid.allocateddate.split('T')[0] : '',
            purchasedate: loadedDid.purchasedate ? loadedDid.purchasedate.split('T')[0] : '',
            type: String(loadedDid.type ?? ''),
            location: String(loadedDid.location ?? '1'),
            terminationno: String(loadedDid.terminationno ?? ''),
            in_ll_callcharge: String(loadedDid.in_ll_callcharge ?? '0'),
            in_m_callcharge: String(loadedDid.in_m_callcharge ?? '0'),
            didlocation: String(loadedDid.didlocation ?? ''),
            countryid: String(loadedDid.countryid ?? ''),
          });
          if (loadedDid.custid) {
            const cust = customersJson?.find((c: Customer) => c.custid === loadedDid.custid);
            if (cust) {
              setSelectedCustomer(cust);
            }
          }
        } else if (initialCustId !== '0') {
          const cust = customersJson?.find((c: Customer) => String(c.custid) === initialCustId);
          if (cust) {
            setSelectedCustomer(cust);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [didnoParam, initialCustId]);

  useEffect(() => {
    if (!countries.length || form.countryid) return;
    const uk = countries.find((c) =>
      c.name.toLowerCase().includes('united kingdom') ||
      (c.code || '').toLowerCase() === 'gb'
    );
    if (uk) {
      setForm((prev) => ({ ...prev, countryid: String(uk.id) }));
    }
  }, [countries, form.countryid]);

  const didTypeOptions = useMemo(() => {
    return products.filter((p) => !p.isdeleted);
  }, [products]);

  useEffect(() => {
    if (!didTypeMenuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (didTypeButtonRef.current?.contains(target) || didTypeMenuRef.current?.contains(target)) {
        return;
      }
      setDidTypeMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
    };
  }, [didTypeMenuOpen]);

  useEffect(() => {
    if (!customerMenuOpen) return;
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (customerButtonRef.current?.contains(target) || customerMenuRef.current?.contains(target)) {
        return;
      }
      setCustomerMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
    };
  }, [customerMenuOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const lowerSearch = customerSearch.toLowerCase();
    return customers.filter(c => c.custname.toLowerCase().includes(lowerSearch));
  }, [customers, customerSearch]);

  const updateField = (field: keyof DidFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.didno.trim()) return 'DID number is required';
    if (!/^[0-9]+$/.test(form.didno.trim())) return 'DID number must be numeric';
    if (!form.custid || form.custid === '0') return 'Customer is required';
    if (!form.type) return 'DID type is required';
    if (!form.location) return 'Location type is required';
    if (!form.countryid) return 'Country is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        didno: form.didno.trim(),
        custid: parseNumber(form.custid) ?? 0,
        allocateddate: form.allocateddate || null,
        purchasedate: form.purchasedate || null,
        type: parseNumber(form.type),
        provider: null,
        location: parseNumber(form.location),
        terminationno: form.terminationno ? form.terminationno.trim() : null,
        in_ll_callcharge: parseNumber(form.in_ll_callcharge) ?? 0,
        in_m_callcharge: parseNumber(form.in_m_callcharge) ?? 0,
        didlocation: form.didlocation.trim() || null,
        countryid: parseNumber(form.countryid),
      };

      const res = await fetch(isEditMode ? '/api/dids' : '/api/dids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save DID');
      }

      router.push('/dids');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save DID');
    } finally {
      setSaving(false);
    }
  };

  const inputClassName =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200';
  const labelClassName = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {isEditMode ? 'Edit DID Number' : 'Add DID Number'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode
              ? 'Update details for this DID.'
              : 'Create a new DID entry and assign it to a customer.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className={labelClassName}>* DID Number</label>
            <input
              type="text"
              value={form.didno}
              onChange={(e) => updateField('didno', e.target.value)}
              className={`${inputClassName} ${isEditMode ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
              placeholder="e.g. 442012345678"
              required
              disabled={isEditMode}
            />
          </div>

          <div className="relative">
            <label className={labelClassName}>* Customer</label>
            <button
              ref={customerButtonRef}
              type="button"
              onClick={() => setCustomerMenuOpen((open) => !open)}
              className={`${inputClassName} flex items-center justify-between text-left`}
            >
              <span className="truncate">
                {form.custid === '0' || !form.custid
                  ? 'Select customer'
                  : selectedCustomer?.custname || 'Select customer'}
              </span>
              <span className="text-gray-500 flex-shrink-0 ml-2">▾</span>
            </button>

            {customerMenuOpen && (
              <div
                ref={customerMenuRef}
                className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 flex flex-col"
              >
                <div className="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search customer..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="overflow-y-auto max-h-48">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No customers found</div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.custid}
                        type="button"
                        onClick={() => {
                          updateField('custid', String(c.custid));
                          setSelectedCustomer(c);
                          setCustomerMenuOpen(false);
                          setCustomerSearch('');
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 truncate ${
                          form.custid === String(c.custid) ? 'bg-gray-100 dark:bg-gray-800 font-medium' : ''
                        }`}
                      >
                        {c.custname}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className={labelClassName}>Allocated Date</label>
            <DatePicker
              selected={form.allocateddate ? new Date(form.allocateddate) : null}
              onChange={(date: Date | null) =>
                updateField('allocateddate', date ? date.toISOString().split('T')[0] : '')
              }
              dateFormat="dd/MM/yyyy"
              placeholderText="Select a date"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Purchase Date</label>
            <DatePicker
              selected={form.purchasedate ? new Date(form.purchasedate) : null}
              onChange={(date: Date | null) =>
                updateField('purchasedate', date ? date.toISOString().split('T')[0] : '')
              }
              dateFormat="dd/MM/yyyy"
              placeholderText="Select a date"
              className={inputClassName}
            />
          </div>

          <div className="relative">
            <label className={labelClassName}>* DID Type</label>
            <button
              ref={didTypeButtonRef}
              type="button"
              onClick={() => setDidTypeMenuOpen((open) => !open)}
              className={`${inputClassName} flex items-center justify-between`}
            >
              <span>
                {form.type
                  ? didTypeOptions.find((p) => String(p.prodid) === form.type)?.prodname || 'Select type'
                  : 'Select type'}
              </span>
              <span className="text-gray-500">▾</span>
            </button>
            {didTypeMenuOpen && (
              <div
                ref={didTypeMenuRef}
                className="absolute left-0 top-full z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
              >
                {didTypeOptions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No DID types available</div>
                )}
                {didTypeOptions.map((p) => (
                  <button
                    key={p.prodid}
                    type="button"
                    onClick={() => {
                      updateField('type', String(p.prodid));
                      setDidTypeMenuOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      form.type === String(p.prodid) ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                  >
                    {p.prodname}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClassName}>* Location Type</label>
            <select
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              className={inputClassName}
              required
            >
              {locationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>Termination Number</label>
            <input
              type="text"
              value={form.terminationno}
              onChange={(e) => updateField('terminationno', e.target.value)}
              className={inputClassName}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={labelClassName}>Incoming LL Call Charge</label>
            <input
              type="number"
              step="0.001"
              value={form.in_ll_callcharge}
              onChange={(e) => updateField('in_ll_callcharge', e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Incoming Mobile Call Charge</label>
            <input
              type="number"
              step="0.001"
              value={form.in_m_callcharge}
              onChange={(e) => updateField('in_m_callcharge', e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>DID Call Location</label>
            <input
              type="text"
              value={form.didlocation}
              onChange={(e) => updateField('didlocation', e.target.value)}
              className={inputClassName}
              placeholder="e.g. London"
            />
          </div>

          <div>
            <label className={labelClassName}>* Country</label>
            <select
              value={form.countryid}
              onChange={(e) => updateField('countryid', e.target.value)}
              className={`${inputClassName} py-1.5`}
              required
            >
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dids')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save DID'}
          </button>
        </div>
      </form>
    </div>
  );
}
