import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCars } from '../api/cars';
import { formatCurrency, formatDate, daysInStock } from '../utils/formatters';
import SkeletonCard from '../components/skeleton/SkeletonCard';

const SoldHistory = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchSoldCars();
  }, []);

  const fetchSoldCars = async () => {
    try {
      const response = await getCars({ status: 'sold' });
      // Enrich with sale data
      const carsWithSales = response.data.map(car => {
        const totalCost = parseFloat(car.purchase_price) + (car.costs?.total_expenses || 0);
        const salePrice = car.sale?.sale_price || 0;
        const profit = salePrice - totalCost;
        const profitMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

        return {
          ...car,
          totalCost,
          profit,
          profitMargin,
          daysToSell: car.sale ? Math.floor((new Date(car.sale.sale_date) - new Date(car.purchase_date)) / (1000 * 60 * 60 * 24)) : 0
        };
      });
      setCars(carsWithSales);
    } catch (error) {
      console.error('Error fetching sold cars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Search
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(car =>
        car.registration_plate?.toLowerCase().includes(s) ||
        car.make?.toLowerCase().includes(s) ||
        car.model?.toLowerCase().includes(s) ||
        car.color?.toLowerCase().includes(s) ||
        car.sale?.customer_name?.toLowerCase().includes(s)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.sale?.sale_date || 0) - new Date(a.sale?.sale_date || 0));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.sale?.sale_date || 0) - new Date(b.sale?.sale_date || 0));
        break;
      case 'profit_high':
        result.sort((a, b) => b.profit - a.profit);
        break;
      case 'profit_low':
        result.sort((a, b) => a.profit - b.profit);
        break;
      case 'margin_high':
        result.sort((a, b) => b.profitMargin - a.profitMargin);
        break;
      case 'days_long':
        result.sort((a, b) => b.daysToSell - a.daysToSell);
        break;
    }

    return result;
  }, [cars, search, sortBy]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredCars.reduce((acc, car) => ({
      totalRevenue: acc.totalRevenue + (car.sale?.sale_price || 0),
      totalProfit: acc.totalProfit + car.profit,
      totalCost: acc.totalCost + car.totalCost,
      count: acc.count + 1
    }), { totalRevenue: 0, totalProfit: 0, totalCost: 0, count: 0 });
  }, [filteredCars]);

  const avgProfitMargin = totals.totalRevenue > 0 ? (totals.totalProfit / totals.totalRevenue) * 100 : 0;
  const avgDaysToSell = filteredCars.length > 0
    ? filteredCars.reduce((sum, car) => sum + car.daysToSell, 0) / filteredCars.length
    : 0;

  if (loading) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <Skeleton className="h-8 sm:h-9 w-48" />
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sold History</h1>
        <Link
          to="/inventory"
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 w-full sm:w-auto text-sm text-center"
        >
          View Inventory
        </Link>
      </div>

      {/* Stats Summary */}
      {filteredCars.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Sales</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{totals.count}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totals.totalRevenue)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Total Profit</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totals.totalProfit)}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600">Avg Margin</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgProfitMargin.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Search and Sort */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by rego, make, model, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 text-sm"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 text-sm"
        >
          <option value="newest">Newest Sales First</option>
          <option value="oldest">Oldest Sales First</option>
          <option value="profit_high">Highest Profit</option>
          <option value="profit_low">Lowest Profit</option>
          <option value="margin_high">Highest Margin</option>
          <option value="days_long">Longest in Stock</option>
        </select>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-gray-600 mb-4">
          {filteredCars.length} of {cars.length} sold cars
        </p>
      )}

      {/* Sold Cars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6 border-l-4 border-gray-400">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-gray-600">{car.registration_plate}</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 flex-shrink-0">
                SOLD
              </span>
            </div>

            <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <div className="flex justify-between">
                <span>Year:</span>
                <span className="font-medium">{car.year}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium">{car.sale?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Sold Date:</span>
                <span className="font-medium">{formatDate(car.sale?.sale_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sale Price:</span>
                <span className="font-medium text-green-600">{formatCurrency(car.sale?.sale_price)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit:</span>
                <span className={`font-semibold ${car.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(car.profit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Margin:</span>
                <span className="font-medium">{car.profitMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Days to Sell:</span>
                <span className="font-medium">{car.daysToSell}</span>
              </div>
            </div>

            <Link
              to={`/cars/${car.id}`}
              className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {filteredCars.length === 0 && cars.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          No sold cars match your search.
        </div>
      )}

      {cars.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No cars sold yet. Sell your first car to see it here!
        </div>
      )}
    </div>
  );
};

export default SoldHistory;
