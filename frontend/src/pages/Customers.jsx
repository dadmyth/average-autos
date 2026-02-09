import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import SkeletonTable from '../components/skeleton/SkeletonTable';
import Skeleton from '../components/skeleton/Skeleton';

const Customers = () => {
  const { success, error: showError } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetails, setShowDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    license_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const customersData = await getCustomers(search);
      setCustomers(customersData);
    } catch (error) {
      showError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search || customers.length > 0) {
        fetchCustomers();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
        success('Customer updated successfully');
      } else {
        await createCustomer(formData);
        success('Customer added successfully');
      }
      setShowForm(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      address: customer.address || '',
      license_number: customer.license_number || '',
      notes: customer.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (customer) => {
    if (!confirm(`Delete customer ${customer.name}? This will not affect their purchase history.`)) return;

    try {
      await deleteCustomer(customer.id);
      success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete customer');
    }
  };

  const handleViewDetails = async (customer) => {
    try {
      const customerData = await getCustomer(customer.id);
      setShowDetails(customerData);
    } catch (error) {
      showError('Failed to load customer details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      license_number: '',
      notes: ''
    });
    setSelectedCustomer(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <Skeleton className="h-8 sm:h-9 w-40 mb-6" />
        <Skeleton className="h-10 w-64 mb-4" />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={handleAddNew}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 w-full sm:w-auto text-sm"
        >
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 text-sm"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{customer.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.purchase_count || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.total_spent ? formatCurrency(customer.total_spent) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewDetails(customer)} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button onClick={() => handleEdit(customer)} className="text-gray-600 hover:text-gray-900 mr-3">Edit</button>
                    <button onClick={() => handleDelete(customer)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden">
          {customers.map((customer) => (
            <div key={customer.id} className="border-b p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <span>{customer.purchase_count || 0} purchases</span>
                <span>{customer.total_spent ? formatCurrency(customer.total_spent) : '-'}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleViewDetails(customer)} className="text-blue-600 text-sm">View</button>
                <button onClick={() => handleEdit(customer)} className="text-gray-600 text-sm">Edit</button>
                <button onClick={() => handleDelete(customer)} className="text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {customers.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No customers match your search.' : 'No customers yet. Add your first customer to get started!'}
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                  >
                    {selectedCustomer ? 'Update' : 'Add'} Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{showDetails.name}</h2>
                  <p className="text-sm text-gray-600">{showDetails.phone}</p>
                  {showDetails.email && <p className="text-sm text-gray-600">{showDetails.email}</p>}
                </div>
                <button onClick={() => setShowDetails(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {showDetails.purchases && showDetails.purchases.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Purchase History</h3>
                  <div className="space-y-3">
                    {showDetails.purchases.map((purchase) => (
                      <Link
                        key={purchase.id}
                        to={`/cars/${purchase.car_id}`}
                        onClick={() => setShowDetails(null)}
                        className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {purchase.make} {purchase.model} ({purchase.year})
                            </p>
                            <p className="text-sm text-gray-600">{purchase.registration_plate}</p>
                            <p className="text-sm text-gray-500">Purchased: {formatDate(purchase.sale_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(purchase.sale_price)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(showDetails.purchases.reduce((sum, p) => sum + parseFloat(p.sale_price), 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
