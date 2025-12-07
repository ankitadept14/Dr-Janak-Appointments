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
  RefreshCw
} from 'lucide-react';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayDate,
  formatDate,
  formatTime
} from './services/api';
import './App.css';

function App() {
  const [view, setView] = useState('login'); // login, nurse, doctor
  const [userRole, setUserRole] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Form state for nurse
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    date: getTodayDate(),
    time: '',
    notes: ''
  });

  // Fetch appointments
  const fetchAppointments = async (date = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAppointments(date);
      if (response.success) {
        setAppointments(response.appointments || []);
      } else {
        setError(response.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check your API configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = (role) => {
    setUserRole(role);
    setView(role);
    fetchAppointments(role === 'nurse' ? getTodayDate() : selectedDate);
  };

  // Handle logout
  const handleLogout = () => {
    setUserRole(null);
    setView('login');
    setAppointments([]);
    setFormData({
      patientName: '',
      phone: '',
      date: getTodayDate(),
      time: '',
      notes: ''
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit (create appointment)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await createAppointment(formData);
      if (response.success) {
        setFormData({
          patientName: '',
          phone: '',
          date: getTodayDate(),
          time: '',
          notes: ''
        });
        fetchAppointments(getTodayDate());
      } else {
        setError(response.error || 'Failed to create appointment');
      }
    } catch (err) {
      setError('Failed to create appointment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async (id) => {
    setLoading(true);
    try {
      const response = await updateAppointment(id, { status: 'Checked-In' });
      if (response.success) {
        fetchAppointments(getTodayDate());
      } else {
        setError(response.error || 'Failed to check in');
      }
    } catch (err) {
      setError('Failed to check in patient. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change for doctor view
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchAppointments(newDate);
  };

  // Login View
  if (view === 'login') {
    return (
      <div className="app-container">
        <div className="login-container">
          <div className="login-header">
            <Calendar size={48} className="header-icon" />
            <h1>Dr. Janak Appointments</h1>
            <p>Select your role to continue</p>
          </div>
          
          <div className="role-selection">
            <button 
              className="role-btn nurse-btn"
              onClick={() => handleLogin('nurse')}
            >
              <User size={32} />
              <span>Nurse</span>
              <small>Manage appointments</small>
            </button>
            
            <button 
              className="role-btn doctor-btn"
              onClick={() => handleLogin('doctor')}
            >
              <UserCog size={32} />
              <span>Doctor</span>
              <small>View schedule</small>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nurse Dashboard
  if (view === 'nurse') {
    // Show ALL appointments for now - debugging
    const todaysAppointments = appointments;
    console.log('Displaying', todaysAppointments.length, 'appointments in nurse view');
    
    return (
      <div className="app-container">
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="header-content">
              <User className="header-icon" />
              <div>
                <h1>Nurse Dashboard</h1>
                <p>Manage appointments for today</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </header>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="dashboard-content">
            {/* Appointment Form */}
            <section className="card form-section">
              <h2>
                <Plus size={20} />
                Add New Appointment
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="patientName">Patient Name *</label>
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
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time">Time *</label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
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

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Appointment'}
                </button>
              </form>
            </section>

            {/* All Appointments List */}
            <section className="card appointments-section">
              <div className="section-header">
                <h2>
                  <Calendar size={20} />
                  All Appointments ({todaysAppointments.length})
                </h2>
                <button 
                  className="refresh-btn" 
                  onClick={() => fetchAppointments(getTodayDate())}
                  disabled={loading}
                >
                  <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                </button>
              </div>

              {loading && appointments.length === 0 ? (
                <p className="loading-text">Loading appointments...</p>
              ) : todaysAppointments.length === 0 ? (
                <div>
                  <p className="empty-text">No appointments scheduled for today</p>
                  <p className="info-text" style={{fontSize: '12px', color: '#666', marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                    💡 <strong>Note:</strong> Appointments are being saved to your Google Sheet. To display them here, your Google Apps Script needs to be redeployed with the latest code.
                    <br/>
                    📖 See console for setup instructions.
                  </p>
                </div>
              ) : (
                <div className="appointments-list">
                  {todaysAppointments.map((apt) => (
                    <div key={apt.id} className={`appointment-card ${apt.status.toLowerCase()}`}>
                      <div className="appointment-header">
                        <div className="patient-info">
                          <h3>{apt.patientName}</h3>
                          <span className={`badge ${apt.type.toLowerCase()}`}>{apt.type}</span>
                        </div>
                        <span className={`status-badge ${apt.status.toLowerCase()}`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="appointment-details">
                        <div className="detail-item">
                          <Phone size={16} />
                          <span>{apt.phone}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{apt.time}</span>
                        </div>
                        {apt.notes && (
                          <div className="detail-item">
                            <FileText size={16} />
                            <span>{apt.notes}</span>
                          </div>
                        )}
                      </div>

                      {apt.status === 'Scheduled' && (
                        <button
                          className="checkin-btn"
                          onClick={() => handleCheckIn(apt.id)}
                          disabled={loading}
                        >
                          <CheckCircle size={18} />
                          Check In
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Doctor Dashboard
  if (view === 'doctor') {
    return (
      <div className="app-container">
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="header-content">
              <UserCog className="header-icon" />
              <div>
                <h1>Doctor Dashboard</h1>
                <p>View appointment schedule</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </header>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="dashboard-content">
            <section className="card timeline-section">
              <div className="section-header">
                <h2>
                  <Calendar size={20} />
                  Appointment Timeline
                </h2>
                <div className="date-selector">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="date-input"
                  />
                  <button 
                    className="refresh-btn" 
                    onClick={() => fetchAppointments(selectedDate)}
                    disabled={loading}
                  >
                    <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                  </button>
                </div>
              </div>

              {loading && appointments.length === 0 ? (
                <p className="loading-text">Loading appointments...</p>
              ) : appointments.length === 0 ? (
                <p className="empty-text">No appointments for {formatDate(selectedDate)}</p>
              ) : (
                <div className="timeline">
                  {appointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt) => (
                      <div key={apt.id} className="timeline-item">
                        <div className="timeline-time">
                          <Clock size={18} />
                          <span>{apt.time}</span>
                        </div>
                        <div className={`timeline-card ${apt.status.toLowerCase()}`}>
                          <div className="timeline-header">
                            <h3>{apt.patientName}</h3>
                            <div className="badges">
                              <span className={`badge ${apt.type.toLowerCase()}`}>
                                {apt.type}
                              </span>
                              <span className={`status-badge ${apt.status.toLowerCase()}`}>
                                {apt.status}
                              </span>
                            </div>
                          </div>
                          <div className="timeline-details">
                            <div className="detail-item">
                              <Phone size={16} />
                              <span>{apt.phone}</span>
                            </div>
                            {apt.notes && (
                              <div className="detail-item">
                                <FileText size={16} />
                                <span>{apt.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
