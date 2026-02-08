import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStatistics, getExpiryAlerts, getAgingStock } from '../api/dashboard';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, alertsData, agingData, carsData, salesData] = await Promise.all([
          getStatistics(),
          getExpiryAlerts(),
          getAgingStock(),
          getCars({ status: 'active' }),
          getSales()
        ]);
        setStats(statsData.data);
        setAlerts(alertsData.data);
        setAgingStock(agingData.data);
        setActiveCars(carsData.data);
        setSales(salesData.data || []);
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Cars</dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">{stats?.total_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Cars</dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-green-600">{stats?.active_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Sold Cars</dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-800">{stats?.sold_cars || 0}</dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 sm:p-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Profit</dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-green-600">
              {formatCurrency(stats?.total_profit || 0)}
            </dd>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {totalAlertCount > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Alerts
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalAlertCount}</span>
          </h2>

          {/* Expiry Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-amber-500">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">WOF / Registration Expiry</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
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
                            <span className="sm:hidden block text-xs text-gray-500">{alert.make} {alert.model}</span>
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

          {/* Aging Stock Alerts */}
          {agingStock.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden border-l-4 border-orange-500">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Aging Stock (60+ days)</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
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
                            <span className="sm:hidden block text-xs text-gray-500">{car.make} {car.model}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Active Stock */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Active Stock ({activeCars.length})</h2>
          <Link
            to="/inventory"
            className="text-gray-800 hover:text-gray-600 text-sm font-medium"
          >
            View All
          </Link>
        </div>

        {activeCars.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
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
                      <span className="sm:hidden block text-xs text-gray-500">{car.make} {car.model} ({car.year})</span>
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
        ) : (
          <p className="text-gray-500 text-center py-4">No active cars in stock</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
