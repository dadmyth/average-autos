import { useState, useEffect } from 'react';
import { createCar, updateCar } from '../../api/cars';
import { formatDateForInput } from '../../utils/formatters';

const CarForm = ({ isOpen, onClose, onSuccess, car = null }) => {
  const [formData, setFormData] = useState({
    registration_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    odometer: '',
    vin: '',
    registration_expiry: '',
    wof_expiry: '',
    purchase_date: '',
    purchase_price: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (car) {
      // Editing existing car
      setFormData({
        registration_plate: car.registration_plate || '',
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        color: car.color || '',
        odometer: car.odometer || '',
        vin: car.vin || '',
        registration_expiry: formatDateForInput(car.registration_expiry) || '',
        wof_expiry: formatDateForInput(car.wof_expiry) || '',
        purchase_date: formatDateForInput(car.purchase_date) || '',
        purchase_price: car.purchase_price || '',
        notes: car.notes || ''
      });
    } else {
      // Reset for new car
      setFormData({
        registration_plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        odometer: '',
        vin: '',
        registration_expiry: '',
        wof_expiry: '',
        purchase_date: '',
        purchase_price: '',
        notes: ''
      });
    }
    setError('');
  }, [car, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...formData,
        registration_plate: formData.registration_plate.toUpperCase(),
        odometer: formData.odometer ? parseInt(formData.odometer) : null,
        year: parseInt(formData.year),
        purchase_price: parseFloat(formData.purchase_price),
        color: formData.color || null,
        vin: formData.vin || null,
        notes: formData.notes || null
      };

      if (car) {
        await updateCar(car.id, dataToSubmit);
      } else {
        await createCar(dataToSubmit);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving car:', err);
      setError(err.response?.data?.error || err.response?.data?.details?.join(', ') || 'Failed to save car');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {car ? 'Edit Car' : 'Add New Car'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration Plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Plate *
                </label>
                <input
                  type="text"
                  name="registration_plate"
                  value={formData.registration_plate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 uppercase"
                  placeholder="ABC123"
                />
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Toyota"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Corolla"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Silver"
                />
              </div>

              {/* Odometer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer (km)
                </label>
                <input
                  type="number"
                  name="odometer"
                  value={formData.odometer}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="85000"
                />
              </div>

              {/* VIN */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="1HGBH41JXMN109186"
                />
              </div>

              {/* Registration Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Expiry *
                </label>
                <input
                  type="date"
                  name="registration_expiry"
                  value={formData.registration_expiry}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* WOF Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WOF Expiry *
                </label>
                <input
                  type="date"
                  name="wof_expiry"
                  value={formData.wof_expiry}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price (NZD) *
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="12000.00"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Additional information about the car..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : car ? 'Update Car' : 'Add Car'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CarForm;
