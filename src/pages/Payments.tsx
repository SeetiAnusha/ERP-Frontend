import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaDollarSign, FaSearch } from 'react-icons/fa';
import axios from '../api/axios';
import { Payment, Purchase, Sale, Client, Supplier } from '../types';
import { useLanguage } from '../contexts/LanguageContext';


const Payments = () => {
    const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [outstandingDocuments, setOutstandingDocuments] = useState<(Purchase | Sale)[]>([]);

  const [formData, setFormData] = useState({
    registrationDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    paymentAmount: '',
    type: 'Payment Out',
    relatedEntityType: 'Purchase',
    relatedEntityId: '',
    supplierRnc: '',
    supplierName: '',
    clientRnc: '',
    clientName: '',
    outstandingCreditInvoices: 'false',
    outstandingCashInvoices: 'false',
    notes: '',
  });

  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchSuppliers();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchOutstandingDocuments = async (entityType: string, entityId: number) => {
    try {
      console.log('Fetching outstanding documents:', { entityType, entityId });
      
      if (entityType === 'Purchase') {
        const response = await axios.get(`/payments/outstanding/purchases/${entityId}`);
        console.log('Outstanding purchases loaded:', response.data);
        setOutstandingDocuments(response.data);
        
        if (response.data.length === 0) {
          alert(t('noOutstandingInvoicesSupplier'));
        }
      } else if (entityType === 'Sale') {
        const response = await axios.get(`/payments/outstanding/sales/${entityId}`);
        console.log('Outstanding sales loaded:', response.data);
        setOutstandingDocuments(response.data);
        
        if (response.data.length === 0) {
          alert(t('noOutstandingInvoicesClient'));
        }
      }
    } catch (error) {
      console.error('Error fetching outstanding documents:', error);
      alert(t('errorLoadingInvoices'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.relatedEntityId) {
      alert(t('pleaseSelectEntity'));
      return;
    }
    
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      alert(t('enterValidAmount'));
      return;
    }
    
    try {
      // Prepare invoice applications data
      const invoiceApplications = selectedInvoices.map(invoiceId => ({
        invoiceId,
        invoiceNumber: outstandingDocuments.find(doc => doc.id === invoiceId)?.registrationNumber || '',
        appliedAmount: parseFloat(invoicePayments[invoiceId]?.toString() || '0')
      })).filter(app => app.appliedAmount > 0);

      console.log('=== PAYMENT SUBMISSION DEBUG ===');
      console.log('Selected invoices:', selectedInvoices);
      console.log('Invoice payments:', invoicePayments);
      console.log('Outstanding documents:', outstandingDocuments);
      console.log('Invoice applications:', invoiceApplications);
      console.log('================================');

      // Warning if no invoices selected
      if (invoiceApplications.length === 0 && outstandingDocuments.length > 0) {
        const confirmNoInvoices = window.confirm(t('warningNoInvoices'));
        
        if (!confirmNoInvoices) {
          return; // User cancelled, don't submit
        }
      }

      const paymentData = {
        ...formData,
        invoiceApplications: JSON.stringify(invoiceApplications)
      };

      console.log('Submitting payment data:', paymentData);
      console.log('Invoice applications:', invoiceApplications);

      if (editingPayment) {
        const response = await axios.put(`/payments/${editingPayment.id}`, paymentData);
        console.log('Payment updated:', response.data);
      } else {
        const response = await axios.post('/payments', paymentData);
        console.log('Payment created:', response.data);
      }
      
      if (invoiceApplications.length > 0) {
        alert(t('paymentSavedSuccess').replace('{count}', invoiceApplications.length.toString()));
      } else {
        alert(t('paymentSavedNoInvoices'));
      }
      
      fetchPayments();
      resetForm();
    } catch (error: any) {
      console.error('Error saving payment:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error saving payment: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await axios.delete(`/payments/${id}`);
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment');
      }
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      registrationDate: payment.registrationDate.split('T')[0],
      paymentMethod: payment.paymentMethod,
      paymentAmount: payment.paymentAmount.toString(),
      type: payment.type,
      relatedEntityType: payment.relatedEntityType,
      relatedEntityId: payment.relatedEntityId.toString(),
      supplierRnc: payment.supplierRnc || '',
      supplierName: payment.supplierName || '',
      clientRnc: payment.clientRnc || '',
      clientName: payment.clientName || '',
      outstandingCreditInvoices: payment.outstandingCreditInvoices || 'false',
      outstandingCashInvoices: payment.outstandingCashInvoices || 'false',
      notes: payment.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      registrationDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      paymentAmount: '',
      type: 'Payment Out',
      relatedEntityType: 'Purchase',
      relatedEntityId: '',
      supplierRnc: '',
      supplierName: '',
      clientRnc: '',
      clientName: '',
      outstandingCreditInvoices: 'false',
      outstandingCashInvoices: 'false',
      notes: '',
    });
    setEditingPayment(null);
    setShowModal(false);
    setOutstandingDocuments([]);
    setSelectedInvoices([]);
    setInvoicePayments({});
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === parseInt(supplierId));
    if (supplier) {
      setFormData({
        ...formData,
        relatedEntityId: supplierId,
        supplierRnc: supplier.rnc,
        supplierName: supplier.name,
      });
      fetchOutstandingDocuments('Purchase', supplier.id);
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === parseInt(clientId));
    if (client) {
      setFormData({
        ...formData,
        relatedEntityId: clientId,
        clientRnc: client.rncCedula,
        clientName: client.name,
      });
      fetchOutstandingDocuments('Sale', client.id);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || payment.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const totalPaymentsOut = payments
    .filter(p => p.type === 'Payment Out')
    .reduce((sum, p) => sum + parseFloat(p.paymentAmount.toString()), 0);

  const totalPaymentsIn = payments
    .filter(p => p.type === 'Payment In')
    .reduce((sum, p) => sum + parseFloat(p.paymentAmount.toString()), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Payments Management</h2>
            <p className="text-gray-600 mt-1">Track payments to suppliers and from clients</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> New Payment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Payments Out</p>
                <p className="text-2xl font-bold text-red-700">
                  {totalPaymentsOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <FaDollarSign className="text-red-400 text-3xl" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Payments In</p>
                <p className="text-2xl font-bold text-green-700">
                  {totalPaymentsIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <FaDollarSign className="text-green-400 text-3xl" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Net Cash Flow</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(totalPaymentsIn - totalPaymentsOut).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <FaDollarSign className="text-blue-400 text-3xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">{t('allPaymentTypes')}</option>
            <option value="Payment Out">{t('paymentOut')} ({t('toSuppliers')})</option>
            <option value="Payment In">{t('paymentIn')} ({t('fromClients')})</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('registrationNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('paymentType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('selectSupplierOrClient')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('idTaxNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('paymentMethod')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('paymentAmount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('invoicesToApply')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                // Parse invoice applications
                let appliedInvoices: any[] = [];
                try {
                  if ((payment as any).invoiceApplications) {
                    appliedInvoices = typeof (payment as any).invoiceApplications === 'string' 
                      ? JSON.parse((payment as any).invoiceApplications) 
                      : (payment as any).invoiceApplications;
                  }
                } catch (e) {
                  console.error('Error parsing invoice applications:', e);
                }

                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.registrationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.type === 'Payment Out'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.supplierName || payment.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.supplierRnc || payment.clientRnc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {parseFloat(payment.paymentAmount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {appliedInvoices.length > 0 ? (
                        <div className="space-y-1">
                          {appliedInvoices.map((app, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                              <span className="font-medium text-blue-600">{app.invoiceNumber}</span>
                              <span className="text-green-600 font-semibold">
                                {parseFloat(app.appliedAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                          {(payment as any).excessAmount && parseFloat(((payment as any).excessAmount).toString()) > 0 && (
                            <div className="flex justify-between items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                              <span className="text-xs text-yellow-700">{t('balance')}</span>
                              <span className="text-yellow-700 font-semibold text-xs">
                                {parseFloat(((payment as any).excessAmount).toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No invoices applied</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleEdit(payment)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-6">
                {editingPayment ? 'Edit Payment' : 'New Payment'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.registrationDate}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          type: e.target.value,
                          relatedEntityType: e.target.value === 'Payment Out' ? 'Purchase' : 'Sale',
                          relatedEntityId: '',
                          supplierRnc: '',
                          supplierName: '',
                          clientRnc: '',
                          clientName: '',
                          outstandingCreditInvoices: 'false',
                          outstandingCashInvoices: 'false',
                        });
                        setOutstandingDocuments([]);
                        setSelectedInvoices([]);
                        setInvoicePayments({});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Payment Out">Payment Out (To Supplier)</option>
                      <option value="Payment In">Payment In (From Client)</option>
                    </select>
                  </div>

                  {formData.type === 'Payment Out' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier *
                      </label>
                      <select
                        required
                        value={formData.relatedEntityId}
                        onChange={(e) => handleSupplierChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{t('selectSupplier')}</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} - {supplier.rnc}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client *
                      </label>
                      <select
                        required
                        value={formData.relatedEntityId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">{t('selectClient')}</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.name} - {client.rncCedula}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      required
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Deposit">Deposit</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={formData.paymentAmount}
                      onChange={(e) => {
                        // Allow only numbers and decimal point
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        // Ensure only one decimal point
                        const parts = value.split('.');
                        const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                        setFormData({ ...formData, paymentAmount: sanitized });
                      }}
                      onBlur={(e) => {
                        // Format to 2 decimal places on blur
                        const value = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, paymentAmount: value.toFixed(2) });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Outstanding Invoices Options */}
                {outstandingDocuments.length > 0 && (
                  <div className="space-y-4 mt-4">
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-blue-800 mb-2">
                          📋 Important: Select Invoices to Apply Payment
                        </p>
                        <p className="text-xs text-blue-700">
                          1. Check the "List outstanding credit invoices" box below<br/>
                          2. Check the checkbox next to each invoice you want to pay<br/>
                          3. Enter the amount to pay for each selected invoice<br/>
                          4. The purchase/sale balances will be updated automatically
                        </p>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        {t('invoicesToApplyPayment')}:
                      </p>
                      
                      <div className="flex gap-6 mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.outstandingCreditInvoices === 'true'}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              outstandingCreditInvoices: e.target.checked ? 'true' : 'false' 
                            })}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">List outstanding credit invoices</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.outstandingCashInvoices === 'true'}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              outstandingCashInvoices: e.target.checked ? 'true' : 'false' 
                            })}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">List outstanding cash invoices</span>
                        </label>
                      </div>

                      {/* Invoice Selection Table */}
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Select</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Invoice No.</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                                {formData.type === 'Payment Out' ? 'Supplier' : 'Client'}
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Payment Type</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Total Amount</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Balance Pending</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Amount to Pay</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {outstandingDocuments
                              .filter(doc => {
                                // Case-insensitive payment type comparison
                                const docPaymentType = (doc.paymentType || '').toUpperCase();
                                
                                if (formData.outstandingCreditInvoices === 'true' && formData.outstandingCashInvoices === 'true') {
                                  return true; // Show all
                                } else if (formData.outstandingCreditInvoices === 'true') {
                                  return docPaymentType === 'CREDIT' || docPaymentType === 'CREDITO';
                                } else if (formData.outstandingCashInvoices === 'true') {
                                  return docPaymentType === 'CASH' || docPaymentType === 'EFECTIVO';
                                }
                                return false; // Show nothing if no checkbox is checked
                              })
                              .map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedInvoices.includes(doc.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedInvoices([...selectedInvoices, doc.id]);
                                          setInvoicePayments({ ...invoicePayments, [doc.id]: parseFloat(doc.balanceAmount.toString()) });
                                        } else {
                                          setSelectedInvoices(selectedInvoices.filter(id => id !== doc.id));
                                          const newPayments = { ...invoicePayments };
                                          delete newPayments[doc.id];
                                          setInvoicePayments(newPayments);
                                        }
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">{doc.registrationNumber}</td>
                                  <td className="px-3 py-2 text-gray-600">
                                    {new Date(doc.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {formData.type === 'Payment Out' 
                                      ? ('supplier' in doc ? doc.supplier?.name : '') 
                                      : ('client' in doc ? doc.client?.name : '')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 text-xs rounded ${
                                      doc.paymentType === 'Credit' 
                                        ? 'bg-orange-100 text-orange-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {doc.paymentType}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right text-gray-900">
                                    {parseFloat(doc.total.toString()).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-red-600">
                                    {parseFloat(doc.balanceAmount.toString()).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={!selectedInvoices.includes(doc.id)}
                                      value={invoicePayments[doc.id] !== undefined ? invoicePayments[doc.id] : ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                        const numValue = parseFloat(value);
                                        if (!isNaN(numValue)) {
                                          const maxAmount = parseFloat(doc.balanceAmount.toString());
                                          setInvoicePayments({ 
                                            ...invoicePayments, 
                                            [doc.id]: Math.min(numValue, maxAmount)
                                          });
                                        } else if (value === '' || value === '.') {
                                          setInvoicePayments({ 
                                            ...invoicePayments, 
                                            [doc.id]: 0
                                          });
                                        }
                                      }}
                                      className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                      placeholder="0.00"
                                    />
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={7} className="px-3 py-2 text-right font-semibold text-gray-700">
                                Total Amount to Apply:
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-blue-600">
                                {Object.values(invoicePayments).reduce((sum, val) => sum + parseFloat(val?.toString() || '0'), 0).toFixed(2)}
                              </td>
                            </tr>
                            {parseFloat(formData.paymentAmount || '0') > Object.values(invoicePayments).reduce((sum, val) => sum + parseFloat(val?.toString() || '0'), 0) && (
                              <tr>
                                <td colSpan={8} className="px-3 py-2">
                                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-sm text-yellow-800">
                                      <strong>{t('overpaymentDetected')}:</strong> {t('overpaymentMessage')
                                        .replace('{payment}', parseFloat(formData.paymentAmount || '0').toFixed(2))
                                        .replace('{applied}', Object.values(invoicePayments).reduce((sum, val) => sum + parseFloat(val?.toString() || '0'), 0).toFixed(2))
                                        .replace('{excess}', (parseFloat(formData.paymentAmount || '0') - Object.values(invoicePayments).reduce((sum, val) => sum + parseFloat(val?.toString() || '0'), 0)).toFixed(2))}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Note: The listed invoices will be compared to the one to which the payment will be applied, 
                        and when the total amount of the collection is exhausted, that portion will be applied to 
                        the invoice and that invoice will indicate the amount pending collection.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingPayment ? 'Update Payment' : 'Create Payment'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Payments;
