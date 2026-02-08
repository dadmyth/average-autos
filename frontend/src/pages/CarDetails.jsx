import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCar, deleteCar, addServiceRecord, deleteServiceRecord, uploadPhotos, deletePhoto, reorderPhotos, setCoverPhoto } from '../api/cars';
import { createSale, deleteSale } from '../api/sales';
import { uploadDocuments, getDocuments, deleteDocument } from '../api/documents';
import { getSettings } from '../api/settings';
import { createPurchase, getPurchaseByCarId, deletePurchase } from '../api/purchases';
import { getNotesByCarId, createNote, deleteNote } from '../api/notes';
import { formatCurrency, formatDate, getExpiryStatus, daysUntilExpiry, daysInStock } from '../utils/formatters';
import CarForm from '../components/cars/CarForm';
import { useToast } from '../context/ToastContext';

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [documentType, setDocumentType] = useState('other');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSalesAgreement, setShowSalesAgreement] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showPurchaseAgreement, setShowPurchaseAgreement] = useState(false);
  const [purchaseRecord, setPurchaseRecord] = useState(null);
  const [businessDetails, setBusinessDetails] = useState({ business_name: '', business_phone: '', business_email: '' });
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    service_date: '',
    service_type: 'maintenance',
    description: '',
    cost: '',
    provider: '',
    notes: ''
  });
  const [saleFormData, setSaleFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    sale_price: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_license_number: '',
    customer_license_version: '',
    payment_method: 'bank_transfer',
    payment_status: 'completed',
    payment_notes: '',
    notes: ''
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    seller_name: '',
    seller_email: '',
    seller_phone: '',
    seller_address: '',
    seller_license_number: '',
    seller_license_version: '',
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchCarDetails();
    getSettings().then(res => setBusinessDetails(res.data)).catch(() => {});
  }, [id]);

  // ESC key to close lightbox
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImage]);

  const fetchCarDetails = async () => {
    try {
      const [carResponse, docsResponse, notesResponse] = await Promise.all([
        getCar(id),
        getDocuments(id),
        getNotesByCarId(id)
      ]);
      setCar(carResponse.data);
      setDocuments(docsResponse.data || []);
      setNotes(notesResponse.data || []);
      // Fetch purchase record if exists
      try {
        const purchaseResponse = await getPurchaseByCarId(id);
        setPurchaseRecord(purchaseResponse.data);
      } catch {
        setPurchaseRecord(null);
      }
    } catch (error) {
      console.error('Error fetching car details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      await deleteCar(id);
      navigate('/inventory');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete car');
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      await addServiceRecord(id, {
        ...serviceFormData,
        cost: parseFloat(serviceFormData.cost)
      });
      setShowServiceForm(false);
      setServiceFormData({
        service_date: '',
        service_type: 'maintenance',
        description: '',
        cost: '',
        provider: '',
        notes: ''
      });
      fetchCarDetails();
      success('Service record added successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to add service record');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service record?')) return;

    try {
      await deleteServiceRecord(serviceId);
      fetchCarDetails();
      success('Service record deleted successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete service record');
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSale({
        car_id: parseInt(id),
        ...saleFormData,
        sale_price: parseFloat(saleFormData.sale_price),
        customer_license_number: saleFormData.customer_license_number.toUpperCase()
      });
      success('Car marked as sold successfully!');
      navigate('/sales');
    } catch (error) {
      showError(error.response?.data?.error || error.response?.data?.details?.join(', ') || 'Failed to create sale');
    }
  };

  const handleCancelSale = async () => {
    if (!confirm('Are you sure you want to cancel this sale? The car will be returned to active inventory.')) return;

    try {
      await deleteSale(car.sale.id);
      success('Sale cancelled successfully. Car returned to active inventory.');
      fetchCarDetails();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to cancel sale');
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPurchase({
        car_id: parseInt(id),
        purchase_date: car.purchase_date,
        purchase_price: parseFloat(car.purchase_price),
        ...purchaseFormData,
        seller_license_number: purchaseFormData.seller_license_number.toUpperCase()
      });
      success('Purchase agreement created successfully!');
      setShowPurchaseForm(false);
      fetchCarDetails();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to create purchase agreement');
    }
  };

  const handleDeletePurchase = async () => {
    if (!confirm('Are you sure you want to delete this purchase agreement?')) return;

    try {
      await deletePurchase(purchaseRecord.id);
      setPurchaseRecord(null);
      success('Purchase agreement deleted successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete purchase agreement');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await createNote(id, newNote.trim());
      setNotes([response.data, ...notes]);
      setNewNote('');
      setShowNoteForm(false);
      success('Note added successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      success('Note deleted successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete note');
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      await uploadPhotos(id, files);
      fetchCarDetails();
      success('Photos uploaded successfully!');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async (filename) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deletePhoto(id, filename);
      fetchCarDetails();
      success('Photo deleted successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete photo');
    }
  };

  const handleMovePhoto = async (fromIndex, direction) => {
    const photos = [...car.photos];
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= photos.length) return;

    // Swap photos
    [photos[fromIndex], photos[toIndex]] = [photos[toIndex], photos[fromIndex]];

    try {
      await reorderPhotos(id, photos);
      setCar({ ...car, photos });
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to reorder photos');
    }
  };

  const handleSetCoverPhoto = async (photoIndex) => {
    try {
      const response = await setCoverPhoto(id, photoIndex);
      setCar(response.data);
      success('Cover photo set successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to set cover photo');
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);
    try {
      await uploadDocuments(id, files, documentType);
      fetchCarDetails();
      success('Documents uploaded successfully!');
      setDocumentType('other'); // Reset to default
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDocumentDelete = async (filename) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(id, filename);
      fetchCarDetails();
      success('Document deleted successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete document');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!car) {
    return <div className="text-center py-8">Car not found</div>;
  }

  const wofStatus = getExpiryStatus(car.wof_expiry);
  const regStatus = getExpiryStatus(car.registration_expiry);
  const wofDays = daysUntilExpiry(car.wof_expiry);
  const regDays = daysUntilExpiry(car.registration_expiry);

  const totalServiceCost = car.service_records?.reduce((sum, record) => sum + parseFloat(record.cost), 0) || 0;
  const totalCost = parseFloat(car.purchase_price) + totalServiceCost;

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="text-blue-600 hover:text-blue-800 mb-2 sm:mb-4 text-sm"
        >
          ← Back to Inventory
        </button>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {car.make} {car.model} ({car.year})
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mt-1">{car.registration_plate}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              className={`inline-block px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded ${
                car.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {car.status.toUpperCase()}
            </span>
            {car.status === 'active' && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
                {daysInStock(car.purchase_date)} days in stock
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Details Card */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Vehicle Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-gray-500">Make</p>
                <p className="font-medium">{car.make}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{car.model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium">{car.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Color</p>
                <p className="font-medium">{car.color || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Odometer</p>
                <p className="font-medium">{car.odometer ? `${car.odometer.toLocaleString()} km` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VIN</p>
                <p className="font-medium text-xs">{car.vin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">WOF Expiry</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{formatDate(car.wof_expiry)}</p>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      wofStatus === 'expired' ? 'bg-red-100 text-red-800' :
                      wofStatus === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {wofDays < 0 ? 'EXPIRED' : `${wofDays} days`}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Expiry</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{formatDate(car.registration_expiry)}</p>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      regStatus === 'expired' ? 'bg-red-100 text-red-800' :
                      regStatus === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}
                  >
                    {regDays < 0 ? 'EXPIRED' : `${regDays} days`}
                  </span>
                </div>
              </div>
            </div>
            {car.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="mt-1">{car.notes}</p>
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Photos</h2>
              {car.status === 'active' && (
                <label className="bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-700 text-xs sm:text-sm cursor-pointer whitespace-nowrap">
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {car.photos && car.photos.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-2 sm:mb-3 gap-2">
                  <p className="text-xs sm:text-sm text-gray-600">{car.photos.length} photo{car.photos.length !== 1 ? 's' : ''}</p>
                  {car.status === 'active' && car.photos.length > 1 && (
                    <button
                      onClick={() => setReorderMode(!reorderMode)}
                      className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-md ${
                        reorderMode
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {reorderMode ? 'Done' : 'Reorder'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {car.photos.map((photo, index) => (
                    <div key={index} className={`relative ${reorderMode ? 'border-2 border-dashed border-purple-400 rounded-lg p-1' : 'group'}`}>
                      <img
                        src={`/uploads/cars/${photo}`}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => !reorderMode && setLightboxImage(`/uploads/cars/${photo}`)}
                      />
                      {index === 0 && !reorderMode && (
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Cover
                        </div>
                      )}
                      {car.status === 'active' && (
                        <>
                          {reorderMode ? (
                            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 rounded-lg">
                              <button
                                onClick={() => handleMovePhoto(index, 'left')}
                                disabled={index === 0}
                                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleMovePhoto(index, 'right')}
                                disabled={index === car.photos.length - 1}
                                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                              {index !== 0 && (
                                <button
                                  onClick={() => handleSetCoverPhoto(index)}
                                  className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700"
                                  title="Set as cover photo"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePhotoDelete(photo);
                              }}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No photos uploaded yet</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Documents</h2>
              {car.status === 'active' && (
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    disabled={uploadingDocs}
                  >
                    <option value="license">License</option>
                    <option value="payment_confirmation">Payment Confirmation</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="bg-gray-800 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-gray-700 text-xs sm:text-sm cursor-pointer text-center">
                    {uploadingDocs ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDocs}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {documents.length > 0 ? (
              <div className="space-y-4">
                {['license', 'payment_confirmation', 'other'].map((type) => {
                  const typeDocs = documents.filter(doc => doc.document_type === type);
                  if (typeDocs.length === 0) return null;

                  return (
                    <div key={type} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">
                        {type === 'license' ? 'Licenses' : type === 'payment_confirmation' ? 'Payment Confirmations' : 'Other Documents'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {typeDocs.map((doc) => {
                          const isPDF = doc.filename.toLowerCase().endsWith('.pdf');
                          return (
                            <div key={doc.id} className="relative group border rounded-lg p-3">
                              {isPDF ? (
                                <a
                                  href={`/uploads/documents/${doc.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col items-center justify-center h-32 hover:bg-gray-50"
                                >
                                  <svg className="w-12 h-12 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-xs text-gray-600 text-center truncate w-full">PDF</p>
                                </a>
                              ) : (
                                <img
                                  src={`/uploads/documents/${doc.filename}`}
                                  alt={`Document ${doc.id}`}
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setLightboxImage(`/uploads/documents/${doc.filename}`)}
                                />
                              )}
                              {car.status === 'active' && (
                                <button
                                  onClick={() => handleDocumentDelete(doc.filename)}
                                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              <p className="text-xs text-gray-500 mt-1 text-center">
                                {formatDate(doc.uploaded_at)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
            )}
          </div>

          {/* Sales Expenses */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Sales Expenses</h2>
              {car.status === 'active' && (
                <button
                  onClick={() => setShowServiceForm(!showServiceForm)}
                  className="bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-700 text-xs sm:text-sm"
                >
                  {showServiceForm ? 'Cancel' : 'Add Expense'}
                </button>
              )}
            </div>

            {showServiceForm && (
              <form onSubmit={handleServiceSubmit} className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={serviceFormData.service_date}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, service_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={serviceFormData.service_type}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, service_type: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="repair">Repair</option>
                      <option value="wof">WOF</option>
                      <option value="registration">Registration</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={serviceFormData.description}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Oil change, brake pads replacement, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (NZD) *</label>
                    <input
                      type="number"
                      value={serviceFormData.cost}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, cost: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <input
                      type="text"
                      value={serviceFormData.provider}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Mechanic shop name"
                    />
                  </div>
                </div>
                <button type="submit" className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                  Add Expense Record
                </button>
              </form>
            )}

            {car.service_records && car.service_records.length > 0 ? (
              <div className="space-y-3">
                {car.service_records.map((service) => (
                  <div key={service.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{service.description}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(service.service_date)} • {service.service_type} • {formatCurrency(service.cost)}
                        </p>
                        {service.provider && (
                          <p className="text-sm text-gray-500">Provider: {service.provider}</p>
                        )}
                      </div>
                      {car.status === 'active' && (
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No expense records yet</p>
            )}
          </div>

          {/* Activity Notes */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Activity Notes</h2>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-gray-700 text-xs sm:text-sm"
              >
                {showNoteForm ? 'Cancel' : 'Add Note'}
              </button>
            </div>

            {showNoteForm && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note (e.g., 'Customer John enquired about this car', 'Dropped price to $8000', etc.)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
                  rows="3"
                  autoFocus
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteForm(false);
                      setNewNote('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-900">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.created_at).toLocaleString('en-NZ', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 ml-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No activity notes yet. Add notes to track customer enquiries, price changes, etc.</p>
            )}
          </div>

          {/* Purchase Information */}
          {purchaseRecord && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Purchase Information</h2>
                <button
                  onClick={() => setShowPurchaseAgreement(true)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Purchase Agreement
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Purchased From</p>
                  <p className="font-medium">{purchaseRecord.seller_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="font-medium">{formatDate(purchaseRecord.purchase_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Price</p>
                  <p className="font-medium">{formatCurrency(purchaseRecord.purchase_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{purchaseRecord.payment_method.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sale Information */}
          {car.sale && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Sale Information</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSalesAgreement(true)}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Sales Agreement
                  </button>
                  <button
                    onClick={handleCancelSale}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Sale
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{car.sale.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sale Date</p>
                  <p className="font-medium">{formatDate(car.sale.sale_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sale Price</p>
                  <p className="font-medium text-green-600">{formatCurrency(car.sale.sale_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{car.sale.payment_method.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* Financial Summary */}
          <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Financial Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Price</span>
                <span className="font-medium">{formatCurrency(car.purchase_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expense Costs</span>
                <span className="font-medium">{formatCurrency(totalServiceCost)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="font-bold">Total Investment</span>
                <span className="font-bold text-lg">{formatCurrency(totalCost)}</span>
              </div>
              {car.sale && (
                <>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-600">Sale Price</span>
                    <span className="font-medium text-green-600">{formatCurrency(car.sale.sale_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Profit</span>
                    <span className={`font-bold text-lg ${
                      car.sale.sale_price - totalCost >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(car.sale.sale_price - totalCost)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {car.status === 'active' && (
            <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowEditForm(true)}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Edit Car
                </button>
                {!purchaseRecord ? (
                  <button
                    onClick={() => setShowPurchaseForm(true)}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Create Purchase Agreement
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPurchaseAgreement(true)}
                      className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
                    >
                      View Purchase Agreement
                    </button>
                    <button
                      onClick={handleDeletePurchase}
                      className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                      title="Delete purchase agreement"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowSaleForm(!showSaleForm)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Mark as Sold
                </button>
                <button
                  onClick={handleDeleteCar}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete Car
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Car Edit Form Modal */}
      <CarForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSuccess={() => {
          fetchCarDetails();
          setShowEditForm(false);
        }}
        car={car}
      />

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mark as Sold</h2>
                <button onClick={() => setShowSaleForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
                    <input
                      type="date"
                      value={saleFormData.sale_date}
                      onChange={(e) => setSaleFormData({ ...saleFormData, sale_date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={saleFormData.customer_name}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={saleFormData.customer_email}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={saleFormData.customer_phone}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="021234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                    <input
                      type="text"
                      value={saleFormData.customer_license_number}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_license_number: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 uppercase"
                      placeholder="AA123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Version</label>
                    <input
                      type="text"
                      value={saleFormData.customer_license_version}
                      onChange={(e) => setSaleFormData({ ...saleFormData, customer_license_version: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={saleFormData.payment_method}
                      onChange={(e) => setSaleFormData({ ...saleFormData, payment_method: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="finance">Finance</option>
                      <option value="trade_in">Trade-in</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={saleFormData.notes}
                      onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSaleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Confirm Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Agreement Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Purchase Agreement</h2>
                <button onClick={() => setShowPurchaseForm(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Purchase date ({formatDate(car.purchase_date)}) and price ({formatCurrency(car.purchase_price)}) will be taken from the car record.
              </p>

              <form onSubmit={handlePurchaseSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name *</label>
                    <input
                      type="text"
                      value={purchaseFormData.seller_name}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Email</label>
                    <input
                      type="email"
                      value={purchaseFormData.seller_email}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Phone *</label>
                    <input
                      type="tel"
                      value={purchaseFormData.seller_phone}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="021234567"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Address</label>
                    <input
                      type="text"
                      value={purchaseFormData.seller_address}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                    <input
                      type="text"
                      value={purchaseFormData.seller_license_number}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_license_number: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 uppercase"
                      placeholder="AA123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Version</label>
                    <input
                      type="text"
                      value={purchaseFormData.seller_license_version}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, seller_license_version: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <select
                      value={purchaseFormData.payment_method}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, payment_method: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={purchaseFormData.notes}
                      onChange={(e) => setPurchaseFormData({ ...purchaseFormData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="e.g. Trade-in on sale of ABC123"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPurchaseForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                  >
                    Create Agreement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Agreement View Modal */}
      {showPurchaseAgreement && purchaseRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Purchase Agreement</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPurchaseAgreement(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="sales-agreement-print">
                <div className="text-center mb-6">
                  <img src="/logo.svg" alt="GS Autos" className="h-28 w-auto mx-auto mb-4 invert" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">MOTOR VEHICLE PURCHASE AGREEMENT</h1>
                  <p className="text-sm text-gray-600">New Zealand</p>
                  <p className="text-sm text-gray-600 mt-2">Agreement Date: {formatDate(purchaseRecord.purchase_date)}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">PARTIES</h2>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">SELLER</h3>
                      <p className="text-sm text-gray-700">{purchaseRecord.seller_name}</p>
                      {purchaseRecord.seller_email && (
                        <p className="text-sm text-gray-700">Email: {purchaseRecord.seller_email}</p>
                      )}
                      <p className="text-sm text-gray-700">Phone: {purchaseRecord.seller_phone}</p>
                      {purchaseRecord.seller_address && (
                        <p className="text-sm text-gray-700">Address: {purchaseRecord.seller_address}</p>
                      )}
                      <p className="text-sm text-gray-700">License: {purchaseRecord.seller_license_number}</p>
                      {purchaseRecord.seller_license_version && (
                        <p className="text-sm text-gray-700">Version: {purchaseRecord.seller_license_version}</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm">BUYER</h3>
                      <p className="text-sm text-gray-700">{businessDetails.business_name}</p>
                      <p className="text-sm text-gray-700">Phone: {businessDetails.business_phone}</p>
                      <p className="text-sm text-gray-700">Email: {businessDetails.business_email}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">VEHICLE DETAILS</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Registration Plate:</span>
                      <span className="text-sm text-gray-900">{car.registration_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Make & Model:</span>
                      <span className="text-sm text-gray-900">{car.make} {car.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Year:</span>
                      <span className="text-sm text-gray-900">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Color:</span>
                      <span className="text-sm text-gray-900">{car.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Odometer:</span>
                      <span className="text-sm text-gray-900">{car.odometer ? `${car.odometer.toLocaleString()} km` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">VIN:</span>
                      <span className="text-sm text-gray-900 truncate ml-2">{car.vin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">WOF Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(car.wof_expiry)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Registration Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(car.registration_expiry)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">PURCHASE DETAILS</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Purchase Price:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(purchaseRecord.purchase_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Payment Method:</span>
                      <span className="text-sm text-gray-900">{purchaseRecord.payment_method.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">TERMS AND CONDITIONS</h2>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700 leading-relaxed">
                    <li>The Seller warrants that they are the legal owner of the vehicle and have the right to sell it.</li>
                    <li>The Seller warrants that the vehicle is free from any encumbrances, liens, or finance agreements.</li>
                    <li>The Buyer has inspected the vehicle and accepts it in its current condition.</li>
                    <li>The Seller agrees to provide all relevant documentation for the transfer of ownership.</li>
                    <li>The Seller is responsible for ensuring the vehicle is not subject to any outstanding fines or fees.</li>
                    <li>Both parties agree to complete the transfer of registration in a timely manner.</li>
                    <li>This agreement is governed by the laws of New Zealand.</li>
                  </ol>
                </div>

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

                <div className="text-center text-xs text-gray-500 mt-6 pt-3 border-t">
                  <p>This is a legally binding agreement. Both parties should retain a copy for their records.</p>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @media print {
              @page { size: A4; margin: 1.5cm; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              body * { visibility: hidden; }
              .sales-agreement-print, .sales-agreement-print * { visibility: visible; }
              .sales-agreement-print { position: fixed; left: 0; top: 0; width: 100%; height: 100%; padding: 0; margin: 0; overflow: visible; }
              .print\\:hidden { display: none !important; }
              .sales-agreement-print * { color: #000 !important; background: transparent !important; }
              .border-b { border-bottom: 1px solid #000 !important; }
              .border-t { border-top: 1px solid #000 !important; }
              .border-b-2 { border-bottom: 2px solid #000 !important; }
              .sales-agreement-print h1, .sales-agreement-print h2, .sales-agreement-print h3 { page-break-after: avoid; }
              .sales-agreement-print ol, .sales-agreement-print div { page-break-inside: avoid; }
            }
          `}</style>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Sales Agreement Modal */}
      {showSalesAgreement && car.sale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header - Hide when printing */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-2xl font-bold text-gray-900">Sales Agreement</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
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
                  <img src="/logo.svg" alt="GS Autos" className="h-28 w-auto mx-auto mb-4 invert" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">MOTOR VEHICLE SALES AGREEMENT</h1>
                  <p className="text-sm text-gray-600">New Zealand</p>
                  <p className="text-sm text-gray-600 mt-2">Agreement Date: {formatDate(car.sale.sale_date)}</p>
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
                      <p className="text-sm text-gray-700">{car.sale.customer_name}</p>
                      {car.sale.customer_email && (
                        <p className="text-sm text-gray-700">Email: {car.sale.customer_email}</p>
                      )}
                      <p className="text-sm text-gray-700">Phone: {car.sale.customer_phone}</p>
                      <p className="text-sm text-gray-700">License: {car.sale.customer_license_number}</p>
                      {car.sale.customer_license_version && (
                        <p className="text-sm text-gray-700">Version: {car.sale.customer_license_version}</p>
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
                      <span className="text-sm text-gray-900">{car.registration_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Make & Model:</span>
                      <span className="text-sm text-gray-900">{car.make} {car.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Year:</span>
                      <span className="text-sm text-gray-900">{car.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Color:</span>
                      <span className="text-sm text-gray-900">{car.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Odometer:</span>
                      <span className="text-sm text-gray-900">{car.odometer ? `${car.odometer.toLocaleString()} km` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">VIN:</span>
                      <span className="text-sm text-gray-900 truncate ml-2">{car.vin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">WOF Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(car.wof_expiry)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Registration Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(car.registration_expiry)}</span>
                    </div>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-3 border-b pb-2">SALE DETAILS</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Sale Price:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(car.sale.sale_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Payment Method:</span>
                      <span className="text-sm text-gray-900">{car.sale.payment_method.replace('_', ' ').toUpperCase()}</span>
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
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                padding: 0;
                margin: 0;
                overflow: visible;
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

export default CarDetails;
