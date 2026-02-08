import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStatistics, getExpiryAlerts, getAgingStock, getMonthlySales } from '../api/dashboard';
import { getCars } from '../api/cars';
import { getSales } from '../api/sales';
import { formatCurrency, formatDate, daysInStock } from '../utils/formatters';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [agingStock, setAgingStock] = useState([]);
  const [activeCars, setActiveCars] = useState([]);
  const [sales, setSales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, alertsData, agingData, carsData, salesData, monthlyData] = await Promise.all([
          getStatistics(),
          getExpiryAlerts(),
          getAgingStock(),
          getCars({ status: 'active' }),
          getSales(),
          getMonthlySales()
        ]);
        setStats(statsData.data);
        setAlerts(alertsData.data);
        setAgingStock(agingData.data);
        setActiveCars(carsData.data);
        setSales(salesData.data || []);
        setMonthlySales(monthlyData.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const totalAlertCount = alerts.length + agingStock.length;

  // Prepare chart data
  const inventoryData = [
    { name: 'Active', value: stats?.active_cars || 0, color: '#10b981' },
    { name: 'Sold', value: stats?.sold_cars || 0, color: '#3b82f6' }
  ];

  // Prepare profit data for sold cars
  const profitData = sales.map(sale => ({
    name: `${sale.make} ${sale.model}`,
    profit: sale.profit || 0,
    salePrice: sale.sale_price,
    totalCost: sale.total_cost || 0
  })).slice(0, 10);

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-4 lg:p-5">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Cars</dt>
            <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">{stats?.total_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-4 lg:p-5">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Active Cars</dt>
            <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-green-600">{stats?.active_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-4 lg:p-5">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Sold Cars</dt>
            <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800">{stats?.sold_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg col-span-2 sm:col-span-1">
          <div className="p-3 sm:p-4 lg:p-5">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Profit</dt>
            <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-green-600">
              {formatCurrency(stats?.total_profit || 0)}
            </dd>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      {stats?.sold_cars > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-4 lg:p-5">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Avg Days to Sell</dt>
              <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-blue-600">
                {stats?.average_days_to_sell || 0}
                <span className="text-sm sm:text-base font-normal text-gray-500 ml-1">days</span>
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-4 lg:p-5">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Profit Margin</dt>
              <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-purple-600">
                {stats?.profit_margin?.toFixed(1) || 0}%
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg col-span-2 sm:col-span-1">
            <div className="p-3 sm:p-4 lg:p-5">
              <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Avg Profit</dt>
              <dd className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold text-green-600">
                {formatCurrency(stats?.average_profit || 0)}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {totalAlertCount > 0 && (
        <div className="mb-6 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            Alerts
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalAlertCount}</span>
          </h2>

          {/* Expiry Alerts - Mobile Card Layout */}
          {alerts.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-amber-500">
              <div className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">WOF / Registration Expiry</h3>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{alert.registration_plate}</div>
                          <div className="text-sm text-gray-600">{alert.make} {alert.model} ({alert.year})</div>
                        </div>
                        <Link to={`/cars/${alert.id}`} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md">View</Link>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.wof_status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : alert.wof_status === 'expiring_soon'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          WOF: {alert.wof_days_until_expiry < 0 ? `${Math.abs(alert.wof_days_until_expiry)}d overdue` : `${alert.wof_days_until_expiry}d`}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.reg_status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : alert.reg_status === 'expiring_soon'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          Reg: {alert.reg_days_until_expiry < 0 ? `${Math.abs(alert.reg_days_until_expiry)}d overdue` : `${alert.reg_days_until_expiry}d`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rego</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Vehicle</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WOF</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rego</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alerts.map((alert) => (
                        <tr key={alert.id}>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {alert.registration_plate}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {alert.make} {alert.model} ({alert.year})
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              alert.wof_status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : alert.wof_status === 'expiring_soon'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {alert.wof_days_until_expiry < 0 ? `${Math.abs(alert.wof_days_until_expiry)}d overdue` : `${alert.wof_days_until_expiry}d`}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              alert.reg_status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : alert.reg_status === 'expiring_soon'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {alert.reg_days_until_expiry < 0 ? `${Math.abs(alert.reg_days_until_expiry)}d overdue` : `${alert.reg_days_until_expiry}d`}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm">
                            <Link to={`/cars/${alert.id}`} className="text-gray-800 hover:text-gray-600 font-medium">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Aging Stock Alerts - Mobile Card Layout */}
          {agingStock.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-orange-500">
              <div className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Aging Stock (60+ days)</h3>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {agingStock.map((car) => (
                    <div key={car.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{car.registration_plate}</div>
                          <div className="text-sm text-gray-600">{car.make} {car.model} ({car.year})</div>
                        </div>
                        <Link to={`/cars/${car.id}`} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md">View</Link>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          car.days_in_stock >= 90 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {car.days_in_stock} days
                        </span>
                        <span className="text-sm text-gray-600">{formatCurrency(car.purchase_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rego</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Vehicle</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Purchase Price</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agingStock.map((car) => (
                        <tr key={car.id}>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {car.registration_plate}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {car.make} {car.model} ({car.year})
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              car.days_in_stock >= 90 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {car.days_in_stock} days
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                            {formatCurrency(car.purchase_price)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm">
                            <Link to={`/cars/${car.id}`} className="text-gray-800 hover:text-gray-600 font-medium">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Inventory Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inventory Status</h2>
          {stats && (stats.active_cars > 0 || stats.sold_cars > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#374151"
                  dataKey="value"
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No inventory data yet</p>
          )}
        </div>

        {/* Profit by Car Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profit per Sold Car</h2>
          {profitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="profit" fill="#10b981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Monthly Sales Trend Chart */}
      {monthlySales.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Sales Trend (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...monthlySales].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return new Date(year, month - 1).toLocaleDateString('en-NZ', { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue') return formatCurrency(value);
                  return value;
                }}
                labelFormatter={(value) => {
                  const [year, month] = value.split('-');
                  return new Date(year, month - 1).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Cars Sold" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Stock */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Stock ({activeCars.length})</h2>
          <Link
            to="/inventory"
            className="text-gray-800 hover:text-gray-600 text-xs sm:text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {activeCars.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2">
              {activeCars.slice(0, 5).map((car) => (
                <div key={car.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{car.registration_plate}</div>
                      <div className="text-sm text-gray-600">{car.make} {car.model} ({car.year})</div>
                    </div>
                    <Link to={`/cars/${car.id}`} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md">View</Link>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{formatCurrency(car.purchase_price)}</span>
                    <span className="text-gray-600">{daysInStock(car.purchase_date)} days</span>
                  </div>
                </div>
              ))}
              {activeCars.length > 5 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  Showing 5 of {activeCars.length} cars
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rego</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Vehicle</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Purchase Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">WOF Expiry</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeCars.map((car) => (
                    <tr key={car.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {car.registration_plate}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                        {car.make} {car.model} ({car.year})
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatCurrency(car.purchase_price)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                        {formatDate(car.purchase_date)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {daysInStock(car.purchase_date)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                        {formatDate(car.wof_expiry)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm">
                        <Link to={`/cars/${car.id}`} className="text-gray-800 hover:text-gray-600 font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">No active cars in stock</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
