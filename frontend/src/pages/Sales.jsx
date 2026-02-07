import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSales } from '../api/sales';
import { getCar } from '../api/cars';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getSettings } from '../api/settings';

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSalesAgreement, setShowSalesAgreement] = useState(false);
  const [agreementCar, setAgreementCar] = useState(null);
  const [businessDetails, setBusinessDetails] = useState({ business_name: '', business_phone: '', business_email: '' });

  useEffect(() => {
    fetchSales();
    getSettings().then(res => setBusinessDetails(res.data)).catch(() => {});
  }, []);

  const fetchSales = async () => {
    try {
      const response = await getSales();
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAgreement = async (sale, e) => {
    e.stopPropagation();
    try {
      const carResponse = await getCar(sale.car_id);
      setAgreementCar(carResponse.data);
      setSelectedSale(sale);
      setShowSalesAgreement(true);
    } catch (error) {
      console.error('Error fetching car details:', error);
      alert('Failed to load sales agreement');
    }
  };

  const handleRowClick = (carId) => {
    navigate(`/cars/${carId}`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales History</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr
                key={sale.id}
                onClick={() => handleRowClick(sale.car_id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {sale.registration_plate}
                  </div>
                  <div className="text-sm text-gray-500">
                    {sale.make} {sale.model} ({sale.year})
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {sale.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(sale.sale_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(sale.sale_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-semibold ${
                      sale.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(sale.profit)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={(e) => handleShowAgreement(sale, e)}
                    className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sales.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No sales yet. Sell your first car to see it here!
        </div>
      )}

      {/* Sales Agreement Modal */}
      {showSalesAgreement && agreementCar && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header - Hide when printing */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Sales Agreement</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowSalesAgreement(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Printable Sales Agreement */}
              <div className="sales-agreement-print">
                <div className="text-center mb-6">
                  <img src="/logo.svg" alt="Average Autos" className="h-12 w-auto mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">MOTOR VEHICLE SALES AGREEMENT</h1>
                  <p className="text-sm text-gray-600">New Zealand</p>
                  <p className="text-sm text-gray-600 mt-2">Agreement Date: {formatDate(selectedSale.sale_date)}</p>
                </div>

                {/* Parties */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">PARTIES</h2>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">SELLER</h3>
                      <p className="text-sm text-gray-700">{businessDetails.business_name}</p>
                      <p className="text-sm text-gray-700">Phone: {businessDetails.business_phone}</p>
                      <p className="text-sm text-gray-700">Email: {businessDetails.business_email}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">BUYER</h3>
                      <p className="text-sm text-gray-700">{selectedSale.customer_name}</p>
                      {selectedSale.customer_email && (
                        <p className="text-sm text-gray-700">Email: {selectedSale.customer_email}</p>
                      )}
                      <p className="text-sm text-gray-700">Phone: {selectedSale.customer_phone}</p>
                      <p className="text-sm text-gray-700">License: {selectedSale.customer_license_number}</p>
                      {selectedSale.customer_license_version && (
                        <p className="text-sm text-gray-700">Version: {selectedSale.customer_license_version}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">VEHICLE DETAILS</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Registration Plate:</span>
                      <span className="text-sm text-gray-900">{agreementCar.registration_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Make & Model:</span>
                      <span className="text-sm text-gray-900">{agreementCar.make} {agreementCar.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Year:</span>
                      <span className="text-sm text-gray-900">{agreementCar.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Color:</span>
                      <span className="text-sm text-gray-900">{agreementCar.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Odometer:</span>
                      <span className="text-sm text-gray-900">{agreementCar.odometer ? `${agreementCar.odometer.toLocaleString()} km` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">VIN:</span>
                      <span className="text-sm text-gray-900 truncate ml-2">{agreementCar.vin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">WOF Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(agreementCar.wof_expiry)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Registration Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(agreementCar.registration_expiry)}</span>
                    </div>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">SALE DETAILS</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Sale Price:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedSale.sale_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Payment Method:</span>
                      <span className="text-sm text-gray-900">{selectedSale.payment_method.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">TERMS AND CONDITIONS</h2>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 leading-relaxed">
                    <li>The Seller warrants that they are the legal owner of the vehicle and have the right to sell it.</li>
                    <li>The vehicle is sold "as is" with all faults, and the Buyer accepts the vehicle in its current condition.</li>
                    <li>The Buyer has inspected the vehicle and is satisfied with its condition.</li>
                    <li>The Seller provides no warranty, either express or implied, regarding the vehicle's condition, performance, or fitness for purpose.</li>
                    <li>The Buyer is responsible for all costs associated with transferring registration and ownership.</li>
                    <li>The Seller will provide all relevant documentation including WOF and registration papers.</li>
                    <li>This agreement is governed by the laws of New Zealand.</li>
                  </ol>
                </div>

                {/* Signatures */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">SIGNATURES</h2>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2 text-sm">SELLER</p>
                      <div className="border-b-2 border-gray-400 mb-2 h-12"></div>
                      <p className="text-xs text-gray-600">Signature</p>
                      <p className="text-xs text-gray-600 mt-3">Date: _______________</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2 text-sm">BUYER</p>
                      <div className="border-b-2 border-gray-400 mb-2 h-12"></div>
                      <p className="text-xs text-gray-600">Signature</p>
                      <p className="text-xs text-gray-600 mt-3">Date: _______________</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 mt-6 pt-3 border-t">
                  <p>This is a legally binding agreement. Both parties should retain a copy for their records.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print-specific styles */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 1.5cm;
              }

              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }

              /* Hide everything except the sales agreement */
              body * {
                visibility: hidden;
              }

              .sales-agreement-print,
              .sales-agreement-print * {
                visibility: visible;
              }

              /* Position the agreement properly */
              .sales-agreement-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0;
                margin: 0;
              }

              /* Hide modal controls */
              .print\\:hidden {
                display: none !important;
              }

              /* Ensure proper text rendering */
              .sales-agreement-print * {
                color: #000 !important;
                background: transparent !important;
              }

              /* Keep borders */
              .border-b {
                border-bottom: 1px solid #000 !important;
              }

              .border-t {
                border-top: 1px solid #000 !important;
              }

              .border-b-2 {
                border-bottom: 2px solid #000 !important;
              }

              /* Prevent page breaks */
              .sales-agreement-print h1,
              .sales-agreement-print h2,
              .sales-agreement-print h3 {
                page-break-after: avoid;
              }

              .sales-agreement-print ol,
              .sales-agreement-print div {
                page-break-inside: avoid;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Sales;
