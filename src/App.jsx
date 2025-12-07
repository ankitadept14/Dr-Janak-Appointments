import { useState, useEffect } from 'react';
import { 
  User, 
  UserCog, 
  Calendar, 
  Clock, 
  Phone, 
  FileText, 
  CheckCircle, 
  Plus,
  LogOut,
  RefreshCw,
  Edit2,
  Trash2,
  Home
} from 'lucide-react';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayDate,
  getTodayBackendDate,
  toDisplayDate,
  toBackendDate,
  generateTimeSlots
} from './services/api';
import './App.css';

function App() {
  const [view, setView] = useState('welcome'); // welcome, nurse, doctor
  const [activeTab, setActiveTab] = useState('appointments'); // appointments, book
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [rescheduleData, setRescheduleData] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    date: getTodayDate(),
    time: '',
    isNewPatient: false,
    notes: ''
  });

  const timeSlots = generateTimeSlots();

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAppointments();
      if (response.success) {
        setAppointments(response.appointments || []);
      } else {
        setError(response.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection from welcome page
  const handleRoleSelect = (role) => {
    setView(role);
    fetchAppointments();
  };

  // Handle logout
  const handleLogout = () => {
    setView('welcome');
    setActiveTab('appointments');
    setAppointments([]);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      patientName: '',
      phone: '',
      date: getTodayDate(),
      time: '',
      isNewPatient: false,
      notes: ''
    });
    setRescheduleData(null);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submit (create appointment)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await createAppointment(formData);
      if (response.success) {
        setSuccess('Appointment created successfully!');
        resetForm();
        fetchAppointments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to create appointment');
      }
    } catch (err) {
      setError('Failed to create appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle check-in toggle
  const handleCheckIn = async (apt) => {
    setLoading(true);
    try {
      const newStatus = apt.checkedIn === 'Yes' ? 'No' : 'Yes';
      const response = await updateAppointment(apt.id, { checkedIn: newStatus });
      if (response.success) {
        setSuccess(`Patient ${newStatus === 'Yes' ? 'checked in' : 'check-in removed'}!`);
        fetchAppointments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to update');
      }
    } catch (err) {
      setError('Failed to update check-in status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle reschedule
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleData) return;

    setLoading(true);
    setError(null);
    try {
      const response = await updateAppointment(rescheduleData.id, {
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      if (response.success) {
        setSuccess('Appointment rescheduled successfully!');
        setRescheduleData(null);
        fetchAppointments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to reschedule');
      }
    } catch (err) {
      setError('Failed to reschedule appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    setLoading(true);
    try {
      const response = await deleteAppointment(id);
      if (response.success) {
        setSuccess('Appointment deleted successfully!');
        fetchAppointments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error || 'Failed to delete');
      }
    } catch (err) {
      setError('Failed to delete appointment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Welcome View
  if (view === 'welcome') {
    return (
      <div className="app-container welcome-container">
        <div className="welcome-card">
          <div className="welcome-header">
            <Calendar size={64} className="welcome-icon" />
            <h1>Dr. Janak's Clinic</h1>
            <p className="welcome-subtitle">Appointment Management System</p>
          </div>
          
          <div className="welcome-content">
            <h2>Welcome!</h2>
            <p>Please select your role to continue</p>
          </div>

          <div className="role-selection">
            <button 
              className="role-btn nurse-btn"
              onClick={() => handleRoleSelect('nurse')}
            >
              <User size={40} />
              <span>Nurse</span>
              <small>Book & manage appointments</small>
            </button>
            
            <button 
              className="role-btn doctor-btn"
              onClick={() => handleRoleSelect('doctor')}
            >
              <UserCog size={40} />
              <span>Doctor</span>
              <small>View patient schedule</small>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard View (Nurse/Doctor)
  const userRole = view === 'nurse' ? 'Nurse' : 'Doctor';
  const userIcon = view === 'nurse' ? <User size={24} /> : <UserCog size={24} />;

  // Filter appointments for today
  const todayBackend = getTodayBackendDate();
  const todaysAppointments = appointments.filter(apt => apt.date === todayBackend);
  const displayAppointments = activeTab === 'appointments' ? appointments : [];

  return (
    <div className="app-container">
      <div className="dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            {userIcon}
            <div>
              <h1>{userRole} Dashboard</h1>
              <p className="header-subtitle">Dr. Janak's Clinic</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <Home size={20} />
            <span>Home</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={18} />
            <span>View Appointments</span>
          </button>
          <button 
            className={`tab ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <Plus size={18} />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <div className="dashboard-content">
          {/* Book Appointment Tab */}
          {activeTab === 'book' && (
            <section className="card">
              <h2 className="card-title">
                <Plus size={20} />
                Book New Appointment
              </h2>
              
              <form onSubmit={handleSubmit} className="appointment-form">
                <div className="form-group">
                  <label htmlFor="patientName">
                    Patient Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter patient name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter 10-digit phone number"
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">
                      Date <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      placeholder="DD-MM-YYYY"
                      pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time">
                      Time <span className="required">*</span>
                    </label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isNewPatient"
                      checked={formData.isNewPatient}
                      onChange={handleInputChange}
                    />
                    <span>New Patient</span>
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </section>
          )}

          {/* View Appointments Tab */}
          {activeTab === 'appointments' && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Calendar size={20} />
                  All Appointments ({appointments.length})
                </h2>
                <button 
                  className="btn btn-icon" 
                  onClick={fetchAppointments}
                  disabled={loading}
                  title="Refresh"
                >
                  <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                </button>
              </div>

              {/* Today's Summary */}
              <div className="summary-card">
                <Clock size={20} />
                <div>
                  <strong>Today's Appointments</strong>
                  <span>{todaysAppointments.length} scheduled</span>
                </div>
              </div>

              {/* Appointments List */}
              {loading && appointments.length === 0 ? (
                <div className="empty-state">
                  <RefreshCw size={48} className="spinning" />
                  <p>Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <p>No appointments scheduled</p>
                </div>
              ) : (
                <div className="appointments-list">
                  {appointments.map(apt => (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-header">
                        <div className="appointment-info">
                          <h3>{apt.patientName}</h3>
                          <span className={`badge badge-${apt.type?.toLowerCase()}`}>
                            {apt.type}
                          </span>
                          {apt.checkedIn === 'Yes' && (
                            <span className="badge badge-success">✓ Checked In</span>
                          )}
                        </div>
                        <div className="appointment-actions">
                          <button
                            className={`btn-icon ${apt.checkedIn === 'Yes' ? 'checked' : ''}`}
                            onClick={() => handleCheckIn(apt)}
                            title={apt.checkedIn === 'Yes' ? 'Remove check-in' : 'Check in patient'}
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setRescheduleData({
                              id: apt.id,
                              patientName: apt.patientName,
                              date: apt.displayDate,
                              time: apt.time
                            })}
                            title="Reschedule"
                          >
                            <Edit2 size={18} />
                          </button>
                          {view === 'nurse' && (
                            <button
                              className="btn-icon btn-danger"
                              onClick={() => handleDelete(apt.id)}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="appointment-details">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span>{apt.displayDate}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{apt.time}</span>
                        </div>
                        <div className="detail-item">
                          <Phone size={16} />
                          <span>{apt.phone}</span>
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="appointment-notes">
                          <FileText size={14} />
                          <span>{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleData && (
        <div className="modal-overlay" onClick={() => setRescheduleData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reschedule Appointment</h2>
              <button className="btn-close" onClick={() => setRescheduleData(null)}>×</button>
            </div>
            <form onSubmit={handleReschedule}>
              <div className="modal-body">
                <p className="modal-patient-name">
                  Patient: <strong>{rescheduleData.patientName}</strong>
                </p>
                
                <div className="form-group">
                  <label htmlFor="reschedule-date">New Date</label>
                  <input
                    type="text"
                    id="reschedule-date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                    placeholder="DD-MM-YYYY"
                    pattern="[0-9]{2}-[0-9]{2}-[0-9]{4}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reschedule-time">New Time</label>
                  <select
                    id="reschedule-time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})}
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRescheduleData(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
