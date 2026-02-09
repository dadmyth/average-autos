import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCars, deleteCar, createCar } from '../api/cars';
import { createSale } from '../api/sales';
import { formatCurrency, formatDate, daysInStock } from '../utils/formatters';
import CarForm from '../components/cars/CarForm';
import SkeletonCard from '../components/skeleton/SkeletonCard';
import Skeleton from '../components/skeleton/Skeleton';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/empty/EmptyState';

const Inventory = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCarForm, setShowCarForm] = useState(false);
  const [showQuickSell, setShowQuickSell] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter state
  const [search, setSearch] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Sale form state
  const [saleFormData, setSaleFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    sale_price: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_license_number: '',
    customer_license_version: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    fetchCars();
  }, [filter]);

  const fetchCars = async () => {
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const carsData = await getCars(filters);
      setCars(carsData);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique makes for the dropdown
  const uniqueMakes = useMemo(() => {
    const makes = [...new Set(cars.map(car => car.make))].sort();
    return makes;
  }, [cars]);

  // Filter and sort cars client-side
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Text search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(car =>
        car.registration_plate?.toLowerCase().includes(s) ||
        car.make?.toLowerCase().includes(s) ||
        car.model?.toLowerCase().includes(s) ||
        car.color?.toLowerCase().includes(s)
      );
    }

    // Make filter
    if (makeFilter) {
      result = result.filter(car => car.make === makeFilter);
    }

    // Year range
    if (yearMin) {
      result = result.filter(car => car.year >= parseInt(yearMin));
    }
    if (yearMax) {
      result = result.filter(car => car.year <= parseInt(yearMax));
    }

    // Price range
    if (priceMin) {
      result = result.filter(car => parseFloat(car.purchase_price) >= parseFloat(priceMin));
    }
    if (priceMax) {
      result = result.filter(car => parseFloat(car.purchase_price) <= parseFloat(priceMax));
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price_low':
        result.sort((a, b) => parseFloat(a.purchase_price) - parseFloat(b.purchase_price));
        break;
      case 'price_high':
        result.sort((a, b) => parseFloat(b.purchase_price) - parseFloat(a.purchase_price));
        break;
      case 'days_high':
        result.sort((a, b) => daysInStock(a.purchase_date) - daysInStock(b.purchase_date));
        result.reverse();
        break;
      case 'year_new':
        result.sort((a, b) => b.year - a.year);
        break;
      case 'year_old':
        result.sort((a, b) => a.year - b.year);
        break;
      case 'make':
        result.sort((a, b) => a.make.localeCompare(b.make));
        break;
    }

    return result;
  }, [cars, search, makeFilter, yearMin, yearMax, priceMin, priceMax, sortBy]);

  const handleAddCar = () => {
    setSelectedCar(null);
    setShowCarForm(true);
  };

  const handleCarFormSuccess = () => {
    fetchCars();
  };

  const handleQuickSell = (car) => {
    setSelectedCar(car);
    setShowQuickSell(true);
  };

  const handleEdit = (car) => {
    setSelectedCar(car);
    setShowCarForm(true);
  };

  const handleDelete = async (car) => {
    if (!confirm(`Are you sure you want to delete ${car.make} ${car.model} (${car.registration_plate})?`)) return;

    try {
      await deleteCar(car.id);
      success('Car deleted successfully');
      fetchCars();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete car');
    }
  };

  const handleDuplicate = async (car) => {
    const newRego = prompt(`Enter registration plate for the duplicate car:`, car.registration_plate + '-COPY');
    if (!newRego) return;

    try {
      const duplicatedCar = {
        make: car.make,
        model: car.model,
        year: car.year,
        color: car.color,
        registration_plate: newRego,
        purchase_date: car.purchase_date,
        purchase_price: car.purchase_price,
        wof_expiry: car.wof_expiry,
        registration_expiry: car.registration_expiry,
        odometer: car.odometer,
        vin: car.vin,
        description: car.description,
        status: 'active'
      };

      await createCar(duplicatedCar);
      success('Car duplicated successfully!');
      fetchCars();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to duplicate car');
    }
  };

  const handleQuickSellSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSale({
        car_id: selectedCar.id,
        ...saleFormData,
        sale_price: parseFloat(saleFormData.sale_price),
        customer_license_number: saleFormData.customer_license_number.toUpperCase()
      });
      success(`Car marked as sold successfully!`);
      setShowQuickSell(false);
      setSaleFormData({
        sale_date: new Date().toISOString().split('T')[0],
        sale_price: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_license_number: '',
        customer_license_version: '',
        payment_method: 'bank_transfer',
        notes: ''
      });
      fetchCars();
    } catch (error) {
      showError(error.response?.data?.error || error.response?.data?.details?.join(', ') || 'Failed to create sale');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setMakeFilter('');
    setYearMin('');
    setYearMax('');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || makeFilter || yearMin || yearMax || priceMin || priceMax || sortBy !== 'newest';

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <Skeleton className="h-8 sm:h-9 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={handleAddCar}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 w-full sm:w-auto text-sm"
        >
          Add New Car
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by rego, make, model, colour..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md border flex items-center justify-center gap-2 ${
              showFilters || hasActiveFilters ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && <span className="bg-white text-gray-800 text-xs font-bold px-1.5 py-0.5 rounded-full">!</span>}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-3 sm:p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="">All Makes</option>
                {uniqueMakes.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={yearMin}
                  onChange={(e) => setYearMin(e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={yearMax}
                  onChange={(e) => setYearMax(e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="days_high">Days in Stock: Most</option>
                <option value="year_new">Year: Newest</option>
                <option value="year_old">Year: Oldest</option>
                <option value="make">Make: A-Z</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">{filteredCars.length} of {cars.length} cars</span>
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'active', 'sold'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-md capitalize ${
              filter === status ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6 relative group">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {car.make} {car.model}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded flex-shrink-0 ${
                  car.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {car.status}
              </span>
            </div>
            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <p><span className="font-medium">Rego:</span> {car.registration_plate}</p>
              <p><span className="font-medium">Year:</span> {car.year}</p>
              <p><span className="font-medium">Purchase:</span> {formatCurrency(car.purchase_price)}</p>
              {car.status === 'active' && (
                <p><span className="font-medium">Days in Stock:</span> {daysInStock(car.purchase_date)}</p>
              )}
              <p><span className="font-medium">WOF Expiry:</span> {formatDate(car.wof_expiry)}</p>
            </div>

            {/* Quick Actions - shown on hover or always on mobile */}
            <div className="flex gap-2 mb-3 sm:mb-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Link
                to={`/cars/${car.id}`}
                className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-xs sm:text-sm font-medium"
              >
                View
              </Link>
              <button
                onClick={() => handleDuplicate(car)}
                className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-md hover:bg-purple-200 text-xs sm:text-sm font-medium"
                title="Duplicate car"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {car.status === 'active' && (
                <>
                  <button
                    onClick={() => handleQuickSell(car)}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 text-xs sm:text-sm font-medium"
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => handleEdit(car)}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 text-xs sm:text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(car)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 text-xs sm:text-sm font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* View Details link for sold cars or as fallback */}
            {(car.status === 'sold' || true) && (
              <Link
                to={`/cars/${car.id}`}
                className="block w-full text-center bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm sm:hidden"
              >
                View Details
              </Link>
            )}
          </div>
        ))}
      </div>

      {filteredCars.length === 0 && cars.length > 0 && (
        <EmptyState
          title="No cars match your filters"
          message="Try adjusting your search or filter criteria to find what you're looking for."
          action={clearFilters}
          actionLabel="Clear Filters"
        />
      )}

      {cars.length === 0 && !loading && (
        <EmptyState
          title="No cars in inventory"
          message="Get started by adding your first car to track your inventory."
          action={handleAddCar}
          actionLabel="Add Your First Car"
        />
      )}

      {/* Car Form Modal */}
      <CarForm
        isOpen={showCarForm}
        onClose={() => setShowCarForm(false)}
        onSuccess={handleCarFormSuccess}
        car={selectedCar}
      />

      {/* Quick Sell Modal */}
      {showQuickSell && selectedCar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Sell</h2>
                  <p className="text-sm text-gray-600">{selectedCar.make} {selectedCar.model} ({selectedCar.registration_plate})</p>
                </div>
                <button onClick={() => setShowQuickSell(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleQuickSellSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                    <input
                      type="date"
                      value={saleFormData.sale_date}
                      onChange={(e) => setSaleFormData({ ...saleFormData, sale_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (NZD) *</label>
                    <input
                      type="number"
                      value={saleFormData.sale_price}
                      onChange={(e) => setSaleFormData({ ...saleFormData, sale_price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      placeholder={formatCurrency(selectedCar.purchase_price)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    />
                  </div>

                  {/* Profit Calculator */}
                  {saleFormData.sale_price && (
                    <div className="col-span-1 sm:col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Profit Calculator</h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Investment</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(parseFloat(selectedCar.purchase_price))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Profit/Loss</p>
                          <p className={`text-sm font-semibold ${
                            (parseFloat(saleFormData.sale_price) - parseFloat(selectedCar.purchase_price)) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(parseFloat(saleFormData.sale_price) - parseFloat(selectedCar.purchase_price))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Margin</p>
                          <p className={`text-sm font-semibold ${
                            ((parseFloat(saleFormData.sale_price) - parseFloat(selectedCar.purchase_price)) / parseFloat(saleFormData.sale_price) * 100) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {((parseFloat(saleFormData.sale_price) - parseFloat(selectedCar.purchase_price)) / parseFloat(saleFormData.sale_price) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      {parseFloat(saleFormData.sale_price) < parseFloat(selectedCar.purchase_price) && (
                        <p className="text-xs text-red-600 mt-2 text-center font-medium">
                          ⚠️ Warning: Sale price is below purchase price
                        </p>
                      )}
                    </div>
                  )}

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={saleFormData.customer_name}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={saleFormData.customer_phone}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                      placeholder="021234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={saleFormData.payment_method}
                      onChange={(e) => setSaleFormData({ ...saleFormData, payment_method: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="finance">Finance</option>
                      <option value="trade_in">Trade-in</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuickSell(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    Confirm Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
