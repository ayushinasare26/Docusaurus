'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { ChevronLeft, Package, Phone, DollarSign, Plus, Trash2, Pencil, X, RotateCcw } from 'lucide-react';
import { usePageHeading } from '@/context/PageHeadingContext';

type Product = {
  custid: number;
  number: string;
  startdate: string;
  prodname: string;
  name: string;
  ip: string;
  loginid: string;
  pwd: string;
  manfname: string;
  ename: string;
  mac: string;
  isdeleted: number;
  invstatus: number;
  comments: string;
  type: number;
  eid: number;
};

type DID = {
  didno: string;
  allocateddate: string;
  purchasedate: string;
  prodname: string;
  location: number;
  isdeleted: number;
};

type VoipRate = {
  crid: number;
  groupcode: string;
  charges: number;
  mobilecharges: number;
};

type GammaRate = {
  crid: number;
  groupcode: string;
  charges: number;
};

type CustomerInfo = {
  custid: number;
  custname: string;
};

type AvailableProduct = {
  prodid: number;
  prodname: string;
};

type AvailableEquipment = {
  eid: number;
  ename: string;
};

type VoipGroupCode = {
  groupcode: string;
};

type GammaGroupCode = {
  ChargeCode: string;
  Destination: string;
};

type TabType = 'dids' | 'products' | 'voipRates' | 'gammaRates';

type ProductFormData = {
  number: string;
  type: number | '';
  name: string;
  startdate: string;
  ip: string;
  loginid: string;
  pwd: string;
  eid: number | '';
  mac: string;
  invstatus: boolean;
  comments: string;
};

type VoipRateFormData = {
  groupcode: string;
  charges: string;
  mobilecharges: string;
};

type GammaRateFormData = {
  groupcode: string;
  charges: string;
};

const initialProductForm: ProductFormData = {
  number: '',
  type: '',
  name: '',
  startdate: '',
  ip: '',
  loginid: '',
  pwd: '',
  eid: '',
  mac: '',
  invstatus: true,
  comments: ''
};

export default function CustomerProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { setHeading } = usePageHeading();
  const custId = params.custId as string;

  const [fcustomer, setCustomer] = useState<CustomerInfo | null>(null);
  const customer = fcustomer;
  const [products, setProducts] = useState<Product[]>([]);
  const [dids, setDids] = useState<DID[]>([]);
  const [voipRates, setVoipRates] = useState<VoipRate[]>([]);
  const [gammaRates, setGammaRates] = useState<GammaRate[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [availableEquipments, setAvailableEquipments] = useState<AvailableEquipment[]>([]);
  const [voipGroupCodes, setVoipGroupCodes] = useState<VoipGroupCode[]>([]);
  const [gammaGroupCodes, setGammaGroupCodes] = useState<GammaGroupCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dids');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showVoipModal, setShowVoipModal] = useState(false);
  const [showGammaModal, setShowGammaModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(initialProductForm);
  const [voipForm, setVoipForm] = useState<VoipRateFormData>({ groupcode: '', charges: '', mobilecharges: '' });
  const [gammaForm, setGammaForm] = useState<GammaRateFormData>({ groupcode: '', charges: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeading('Customer Products');
  }, [setHeading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${custId}/products`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch');
      }

      setCustomer(data.customer);
      setProducts(data.products || []);
      setDids(data.dids || []);
      setVoipRates(data.voipRates || []);
      setGammaRates(data.gammaRates || []);
      setAvailableProducts(data.availableProducts || []);
      setAvailableEquipments(data.availableEquipments || []);
      setVoipGroupCodes(data.voipGroupCodes || []);
      setGammaGroupCodes(data.gammaGroupCodes || []);
    } catch (err) {
      console.error('Error fetching customer products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer products');
    } finally {
      setLoading(false);
    }
  }, [custId]);

  useEffect(() => {
    if (custId) {
      fetchData();
    }
  }, [custId, fetchData]);

  const getLocationName = (location: number) => {
    switch (location) {
      case 1: return 'Geographic';
      case 2: return 'Non Geographic';
      case 3: return 'Toll-Free';
      default: return '—';
    }
  };

  const getTabStyle = (tab: TabType) => {
    const baseStyle = 'px-4 py-2 text-sm font-medium transition-colors border-b-2';
    const activeStyle = 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400';
    const inactiveStyle = 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 dark:text-gray-400';
    return `${baseStyle} ${activeTab === tab ? activeStyle : inactiveStyle}`;
  };

  // Product handlers
  const openAddProduct = () => {
    setEditingProduct(null);
    const firstEid = availableEquipments.length > 0 ? availableEquipments[0].eid : '';
    setProductForm({ ...initialProductForm, eid: firstEid });
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      number: product.number || '',
      type: product.type || '',
      name: product.name || '',
      startdate: product.startdate ? product.startdate.split('T')[0] : '',
      ip: product.ip || '',
      loginid: product.loginid || '',
      pwd: product.pwd || '',
      eid: (product.eid !== null && product.eid !== undefined) ? product.eid : '',
      mac: product.mac || '',
      invstatus: product.invstatus === 1,
      comments: product.comments || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (productForm.eid === '' || productForm.eid === undefined || productForm.eid === null) {
      alert('Please select an equipment before saving.');
      return;
    }
    setSaving(true);
    try {
      const url = `/api/customers/${custId}/numberdetails`;
      const method = editingProduct ? 'PATCH' : 'POST';
      const body = editingProduct
        ? { ...productForm, number: editingProduct.number, newNumber: productForm.number }
        : productForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to save');
      }

      setShowProductModal(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const action = product.isdeleted ? 'restore' : 'delete';
    if (!confirm(`Are you sure you want to ${action} this product?`)) return;

    try {
      const res = await fetch(
        `/api/customers/${custId}/numberdetails?number=${product.number}&restore=${product.isdeleted ? 'true' : 'false'}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to delete');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleDeallocateDid = async (didno: string) => {
    if (!confirm(`Are you sure you want to remove DID ${didno} from this customer?`)) return;

    try {
      const res = await fetch('/api/dids/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ didno })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to remove DID');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove DID');
    }
  };

  // VOIP Rate handlers
  const handleSaveVoipRate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${custId}/voip-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voipForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to save');
      }

      setShowVoipModal(false);
      setVoipForm({ groupcode: '', charges: '', mobilecharges: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save VOIP rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVoipRate = async (crid: number) => {
    if (!confirm('Are you sure you want to delete this VOIP rate?')) return;

    try {
      const res = await fetch(`/api/customers/${custId}/voip-rates?crid=${crid}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to delete');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete VOIP rate');
    }
  };

  // Gamma Rate handlers
  const handleSaveGammaRate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${custId}/gamma-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gammaForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to save');
      }

      setShowGammaModal(false);
      setGammaForm({ groupcode: '', charges: '' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save Gamma rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGammaRate = async (crid: number) => {
    if (!confirm('Are you sure you want to delete this Gamma rate?')) return;

    try {
      const res = await fetch(`/api/customers/${custId}/gamma-rates?crid=${crid}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || 'Failed to delete');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete Gamma rate');
    }
  };

  const inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto">
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto relative">
      {/* Back button and Customer info */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </button>

        {customer && (
          <div className="bg-white dark:bg-white/[0.03] rounded-lg p-4 border border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {customer.custname}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customer ID: {customer.custid}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-white/[0.05] mb-4 gap-1">
        <button onClick={() => setActiveTab('dids')} className={getTabStyle('dids')}>
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            DIDs ({dids.length})
          </span>
        </button>
        <button onClick={() => setActiveTab('products')} className={getTabStyle('products')}>
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products ({products.length})
          </span>
        </button>
        <button onClick={() => setActiveTab('voipRates')} className={getTabStyle('voipRates')}>
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            VOIP Rates ({voipRates.length})
          </span>
        </button>
        <button onClick={() => setActiveTab('gammaRates')} className={getTabStyle('gammaRates')}>
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Gamma Rates ({gammaRates.length})
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl p-2 border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">

        {/* DIDs Table */}
        {activeTab === 'dids' && (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    DID No
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Allocation Date
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Purchase Date
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Type
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Location
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {dids.length > 0 ? (
                  dids.map((did, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 dark:text-white/90">{did.didno}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">
                          {did.allocateddate ? new Date(did.allocateddate).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">
                          {did.purchasedate ? new Date(did.purchasedate).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{did.prodname || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{getLocationName(did.location)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeallocateDid(did.didno)}
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded bg-red-50 dark:bg-red-950/20 hover:bg-red-100 transition-colors"
                          title="Deallocate DID"
                        >
                          Remove
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={6} className="text-center py-8">
                      <span className="text-gray-500 dark:text-gray-400">No DIDs allocated to this customer</span>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Products Table */}
        {activeTab === 'products' && (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Product Name
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Start Date
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Number
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    IP
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Login ID
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Equipment
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    MAC
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {products.length > 0 ? (
                  products.map((product, idx) => (
                    <TableRow
                      key={idx}
                      className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] ${product.isdeleted ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                    >
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 dark:text-white/90">{product.prodname || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">
                          {product.startdate ? new Date(product.startdate).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{product.number || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{product.name || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{product.ip || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">{product.loginid || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">
                          {product.manfname && product.ename ? `${product.manfname} ${product.ename}` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300 font-mono text-xs">{product.mac || '—'}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <Badge color={product.isdeleted ? 'error' : 'success'}>
                          {product.isdeleted ? 'Deleted' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditProduct(product)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium ${product.isdeleted
                              ? 'text-green-600 hover:text-green-800 dark:text-green-400'
                              : 'text-red-600 hover:text-red-800 dark:text-red-400'
                              }`}
                            title={product.isdeleted ? 'Restore' : 'Delete'}
                          >
                            {product.isdeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={10} className="text-center py-8">
                      <span className="text-gray-500 dark:text-gray-400">No products allocated to this customer</span>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* VOIP Rates Table */}
        {activeTab === 'voipRates' && (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Group Code
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Call Rate
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Call Rate (Mobile)
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {voipRates.length > 0 ? (
                  voipRates.map((rate) => (
                    <TableRow key={rate.crid} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 dark:text-white/90">{rate.groupcode}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">£{Number(rate.charges).toFixed(4)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">£{Number(rate.mobilecharges).toFixed(4)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteVoipRate(rate.crid)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={4} className="text-center py-8">
                      <span className="text-gray-500 dark:text-gray-400">No custom VOIP rates for this customer</span>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Gamma Rates Table */}
        {activeTab === 'gammaRates' && (
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-white/[0.03] z-10 border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Group Code
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    Call Rate
                  </TableCell>
                  <TableCell isHeader className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center text-theme-sm dark:text-gray-400">
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {gammaRates.length > 0 ? (
                  gammaRates.map((rate) => (
                    <TableRow key={rate.crid} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="font-medium text-gray-800 dark:text-white/90">{rate.groupcode}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-start">
                        <span className="text-gray-600 dark:text-gray-300">£{Number(rate.charges).toFixed(4)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteGammaRate(rate.crid)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <td colSpan={3} className="text-center py-8">
                      <span className="text-gray-500 dark:text-gray-400">No custom Gamma rates for this customer</span>
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {activeTab === 'dids' && (
          <button
            onClick={() => router.push(`/dids/add?custid=${encodeURIComponent(custId)}`)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add DID
          </button>
        )}
        {activeTab === 'products' && (
          <button
            onClick={openAddProduct}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        )}
        {activeTab === 'voipRates' && (
          <button
            onClick={() => setShowVoipModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add VOIP Rate
          </button>
        )}
        {activeTab === 'gammaRates' && (
          <button
            onClick={() => setShowGammaModal(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Gamma Rate
          </button>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Number *</label>
                <input
                  type="text"
                  value={productForm.number}
                  onChange={(e) => setProductForm(prev => ({ ...prev, number: e.target.value }))}
                  className={inputClassName}
                  required
                />
              </div>
              <div>
                <label className={labelClassName}>Product Type *</label>
                <select
                  value={productForm.type.toString()}
                  onChange={(e) => setProductForm(prev => ({ ...prev, type: Number(e.target.value) || '' }))}
                  className={inputClassName}
                  required
                >
                  <option value="">Select Product</option>
                  {availableProducts.map(p => (
                    <option key={p.prodid} value={p.prodid.toString()}>{p.prodid} - {p.prodname}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>Start Date</label>
                <input
                  type="date"
                  value={productForm.startdate}
                  onChange={(e) => setProductForm(prev => ({ ...prev, startdate: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>IP</label>
                <input
                  type="text"
                  value={productForm.ip}
                  onChange={(e) => setProductForm(prev => ({ ...prev, ip: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Login ID</label>
                <input
                  type="text"
                  value={productForm.loginid}
                  onChange={(e) => setProductForm(prev => ({ ...prev, loginid: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Password</label>
                <input
                  type="text"
                  value={productForm.pwd}
                  onChange={(e) => setProductForm(prev => ({ ...prev, pwd: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Equipment</label>
                <select
                  value={productForm.eid !== undefined && productForm.eid !== null ? productForm.eid.toString() : ''}
                  onChange={(e) => setProductForm(prev => ({ ...prev, eid: e.target.value ? Number(e.target.value) : '' }))}
                  className={inputClassName}
                >
                  {availableEquipments.map(eq => (
                    <option key={eq.eid} value={eq.eid.toString()}>{eq.ename}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>MAC Address</label>
                <input
                  type="text"
                  value={productForm.mac}
                  onChange={(e) => setProductForm(prev => ({ ...prev, mac: e.target.value }))}
                  className={inputClassName}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="invstatus"
                  checked={productForm.invstatus}
                  onChange={(e) => setProductForm(prev => ({ ...prev, invstatus: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="invstatus" className="text-sm text-gray-700 dark:text-gray-300">
                  Consider in Invoice?
                </label>
              </div>
              <div className="col-span-2">
                <label className={labelClassName}>Comments</label>
                <textarea
                  value={productForm.comments}
                  onChange={(e) => setProductForm(prev => ({ ...prev, comments: e.target.value }))}
                  className={`${inputClassName} min-h-[80px]`}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOIP Rate Modal */}
      {showVoipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add VOIP Rate</h3>
              <button onClick={() => setShowVoipModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>Group Code *</label>
                <select
                  value={voipForm.groupcode}
                  onChange={(e) => setVoipForm(prev => ({ ...prev, groupcode: e.target.value }))}
                  className={inputClassName}
                  required
                >
                  <option value="">Select Group Code</option>
                  {voipGroupCodes.map((g, idx) => (
                    <option key={idx} value={g.groupcode}>{g.groupcode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>Call Rate *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={voipForm.charges}
                  onChange={(e) => setVoipForm(prev => ({ ...prev, charges: e.target.value }))}
                  className={inputClassName}
                  placeholder="0.0000"
                  required
                />
              </div>
              <div>
                <label className={labelClassName}>Mobile Call Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={voipForm.mobilecharges}
                  onChange={(e) => setVoipForm(prev => ({ ...prev, mobilecharges: e.target.value }))}
                  className={inputClassName}
                  placeholder="0.0000"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowVoipModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVoipRate}
                disabled={saving || !voipForm.groupcode || !voipForm.charges}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gamma Rate Modal */}
      {showGammaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Add Gamma Rate</h3>
              <button onClick={() => setShowGammaModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClassName}>Group Code *</label>
                <select
                  value={gammaForm.groupcode}
                  onChange={(e) => setGammaForm(prev => ({ ...prev, groupcode: e.target.value }))}
                  className={inputClassName}
                  required
                >
                  <option value="">Select Group Code</option>
                  {gammaGroupCodes.map((g, idx) => (
                    <option key={idx} value={g.ChargeCode}>
                      {g.ChargeCode} - {g.Destination}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName}>Call Rate *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={gammaForm.charges}
                  onChange={(e) => setGammaForm(prev => ({ ...prev, charges: e.target.value }))}
                  className={inputClassName}
                  placeholder="0.0000"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGammaModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGammaRate}
                disabled={saving || !gammaForm.groupcode || !gammaForm.charges}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
