import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCars } from '../api/cars';
import { formatCurrency, formatDate, daysInStock } from '../utils/formatters';
import CarForm from '../components/cars/CarForm';

const Inventory = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCarForm, setShowCarForm] = useState(false);
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

  useEffect(() => {
    fetchCars();
  }, [filter]);

  const fetchCars = async () => {
    try {
      const filters = filter !== 'all' ? { status: filter } : {};
      const response = await getCars(filters);
      setCars(response.data);
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={handleAddCar}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 w-full sm:w-auto"
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
        <div className="bg-white shadow rounded-lg p-4 mb-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-white shadow rounded-lg p-4 sm:p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {car.make} {car.model}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  car.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {car.status}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600 mb-4">
              <p><span className="font-medium">Rego:</span> {car.registration_plate}</p>
              <p><span className="font-medium">Year:</span> {car.year}</p>
              <p><span className="font-medium">Purchase:</span> {formatCurrency(car.purchase_price)}</p>
              {car.status === 'active' && (
                <p><span className="font-medium">Days in Stock:</span> {daysInStock(car.purchase_date)}</p>
              )}
              <p><span className="font-medium">WOF Expiry:</span> {formatDate(car.wof_expiry)}</p>
            </div>
            <Link
              to={`/cars/${car.id}`}
              className="block w-full text-center bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {filteredCars.length === 0 && cars.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          No cars match your filters.{' '}
          <button onClick={clearFilters} className="text-gray-800 hover:underline font-medium">Clear filters</button>
        </div>
      )}

      {cars.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No cars found. Add your first car to get started!
        </div>
      )}

      {/* Car Form Modal */}
      <CarForm
        isOpen={showCarForm}
        onClose={() => setShowCarForm(false)}
        onSuccess={handleCarFormSuccess}
        car={selectedCar}
      />
    </div>
  );
};

export default Inventory;
