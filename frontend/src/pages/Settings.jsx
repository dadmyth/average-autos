import { useState, useEffect } from 'react';
import { getSettings, updateSettings, changePassword } from '../api/settings';

const Settings = () => {
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessMessage, setBusinessMessage] = useState('');
  const [businessError, setBusinessError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await getSettings();
        setBusinessName(s.business_name || '');
        setBusinessPhone(s.business_phone || '');
        setBusinessEmail(s.business_email || '');
        setBusinessAddress(s.business_address || '');
      } catch (err) {
        setBusinessError('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setBusinessError('');
    setBusinessMessage('');
    setBusinessLoading(true);
    try {
      await updateSettings({
        business_name: businessName,
        business_phone: businessPhone,
        business_email: businessEmail,
        business_address: businessAddress,
      });
      setBusinessMessage('Business details updated successfully');
    } catch (err) {
      setBusinessError(err.response?.data?.error || 'Failed to update settings');
    }
    setBusinessLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    }
    setPasswordLoading(false);
  };

  const inputClass = 'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>

      {/* Business Details */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Business Details</h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">These details appear on sales agreements and documents.</p>
        {businessError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{businessError}</div>
        )}
        {businessMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{businessMessage}</div>
        )}
        <form onSubmit={handleBusinessSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business Name</label>
            <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" required value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address <span className="text-gray-400">(optional)</span></label>
            <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={businessLoading}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
            {businessLoading ? 'Saving...' : 'Save Business Details'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow rounded-lg p-3 sm:p-4 lg:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Change Password</h2>
        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{passwordError}</div>
        )}
        {passwordMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{passwordMessage}</div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={passwordLoading}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
