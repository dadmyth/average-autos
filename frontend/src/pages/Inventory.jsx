import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCars } from '../api/cars';
import { formatCurrency, formatDate } from '../utils/formatters';
import CarForm from '../components/cars/CarForm';

const Inventory = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCarForm, setShowCarForm] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

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

  const handleAddCar = () => {
    setSelectedCar(null);
    setShowCarForm(true);
  };

  const handleCarFormSuccess = () => {
    fetchCars();
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={handleAddCar}
          className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Add New Car
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md ${
            filter === 'active' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('sold')}
          className={`px-4 py-2 rounded-md ${
            filter === 'sold' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Sold
        </button>
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <div key={car.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
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
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p><span className="font-medium">Rego:</span> {car.registration_plate}</p>
              <p><span className="font-medium">Year:</span> {car.year}</p>
              <p><span className="font-medium">Purchase:</span> {formatCurrency(car.purchase_price)}</p>
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
