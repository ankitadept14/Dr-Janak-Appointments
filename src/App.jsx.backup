import { useState, useEffect } from 'react';
import {
  User, UserCog, Calendar, Clock, Phone, FileText, CheckCircle, Plus, LogOut, RefreshCw,
  Edit2, Trash2, Home, MessageCircle, Search, X, ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';
import {
  login, getAppointments, createAppointment, updateAppointment, deleteAppointment,
  getPatients, createPatient, updatePatient, getDoctors, createUser, updateUser,
  getTodayDate, getTodayDateISO, getTodayBackendDate, toDisplayDate, toBackendDate, 
  generateTimeSlots, isoToDisplayDate, displayToIsoDate
} from './services/api';
import './App.css';

function App() {
  const [view, setView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedAptId, setExpandedAptId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: ''
  });

  const timeSlots = generateTimeSlots();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const { loginId, loginPassword } = e.target.elements;
    
    // Validation
    if (!loginId.value.trim()) {
      setError('Please enter your login ID');
      return;
    }
    if (!loginPassword.value.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login with ID:', loginId.value.trim());
      const result = await login(loginId.value.trim(), loginPassword.value);
      console.log('Login result:', result);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setView(result.user.role);
        await fetchAllData();
        setSuccess('Logged in successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Don't auto-dismiss error - user needs to read it
        const errorMsg = result.error || 'Invalid login credentials. Please check your ID and password.';
        console.error('Login failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = 'Connection error. Please verify: 1) Google Apps Script is deployed 2) Users sheet exists with your credentials';
      console.error('Login error:', err);
      setError(errorMsg);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setAppointments([]);
    setPatients([]);
    setDoctors([]);
    resetForm();
  };

  const fetchAllData = async () => {
    setLoading(true);
    const [aptsRes, patsRes, docsRes] = await Promise.all([
      getAppointments(),
      getPatients(),
      getDoctors()
    ]);

    if (aptsRes.success) setAppointments(aptsRes.appointments || []);
    if (patsRes.success) setPatients(patsRes.patients || []);
    if (docsRes.success) setDoctors(docsRes.doctors || []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: ''
    });
    setShowPatientSearch(false);
    setPatientSearchTerm('');
    setSearchResults([]);
  };

  const handlePatientSearch = async (e) => {
    const term = e.target.value;
    setPatientSearchTerm(term);
    setFormData(prev => ({ ...prev, patientName: term }));
    
    if (term.length >= 3) {
      const result = await getPatients(term);
      setSearchResults(result.success ? result.patients : []);
      setShowPatientSearch(true);
    } else {
      setSearchResults([]);
      setShowPatientSearch(false);
    }
  };

  const selectPatient = (patient) => {
    setFormData(prev => ({
      ...prev,
      patientName: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      dob: patient.dob
    }));
    setPatientSearchTerm(patient.name);
    setShowPatientSearch(false);
    setSearchResults([]);
  };

  const createNewPatient = async () => {
    if (!formData.patientName || !formData.phone) {
      setError('Patient name and phone are required');
      return;
    }

    const result = await createPatient({
      name: formData.patientName,
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob
    });

    if (result.success) {
      setSuccess('Patient created successfully!');
      await fetchAllData();
    } else {
      setError(result.error || 'Failed to create patient');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.doctor && (currentUser.role === 'nurse' || (currentUser.role === 'head-doctor' && !formData.doctor))) {
      setError('Please select a doctor');
      setLoading(false);
      return;
    }

    const doctorName = currentUser.role === 'doctor' ? currentUser.doctorName :
                       currentUser.role === 'head-doctor' && !formData.doctor ? currentUser.doctorName :
                       formData.doctor;

    const result = await createAppointment({
      patientName: formData.patientName,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      doctor: doctorName,
      createdBy: currentUser.id
    });

    setLoading(false);
    if (result.success) {
      setSuccess('Appointment booked successfully!');
      resetForm();
      await fetchAllData();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to book appointment');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleStatusToggle = async (apt, newStatus) => {
    const result = await updateAppointment(apt.id, { status: newStatus, updatedBy: currentUser.id });
    if (result.success) {
      setSuccess(`Appointment marked as ${newStatus}`);
      await fetchAllData();
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(result.error);
    }
  };

  const handleNoteEdit = async (aptId) => {
    const result = await updateAppointment(aptId, { notes: editingNoteText, updatedBy: currentUser.id });
    if (result.success) {
      setEditingNoteId(null);
      await fetchAllData();
    } else {
      setError(result.error);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    const result = await deleteAppointment(id);
    if (result.success) {
      setSuccess('Appointment deleted');
      await fetchAllData();
    } else {
      setError(result.error);
    }
  };

  const getVisibleAppointments = () => {
    let filtered = appointments;
    if (currentUser.role === 'doctor') {
      filtered = filtered.filter(apt => apt.doctor === currentUser.doctorName);
    }
    if (!expandedAptId) {
      filtered = filtered.filter(apt => apt.status !== 'NotComing');
    }
    return filtered;
  };

  const getUpcomingAppointments = () => {
    const visible = getVisibleAppointments();
    const today = getTodayBackendDate();
    const upcoming = visible
      .filter(apt => apt.date >= today)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
      });
    return upcoming;
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => apt.date === toBackendDate(date) && apt.doctor === currentUser.doctorName);
  };

  if (!currentUser || view === 'login') {
    return (
      <div className="app-container login-container">
        <div className="login-card">
          <div className="login-header">
            <Calendar size={64} />
            <h1>Dr. Janak's Clinic</h1>
            <p>Appointment Management System</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Login ID <span className="required">*</span></label>
              <input 
                type="text" 
                name="loginId" 
                required 
                placeholder="Enter your ID"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password <span className="required">*</span></label>
              <input 
                type="password" 
                name="loginPassword" 
                required 
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="alert alert-error">
                {error}
                <button type="button" onClick={() => setError(null)}>×</button>
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'nurse') {
    return (
      <div className="app-container">
        <header className="dashboard-header">
          <div className="header-content">
            <User size={24} />
            <div>
              <h1>Nurse Dashboard</h1>
              <p>Dr. Janak's Clinic</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </header>

        <div className="tabs">
          <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            <Calendar size={18} /> View Appointments
          </button>
          <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
            <Plus size={18} /> Book Appointment
          </button>
        </div>

        {error && <div className="alert alert-error">{error}<button onClick={() => setError(null)}>×</button></div>}
        {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess(null)}>×</button></div>}

        <div className="dashboard-content">
          {activeTab === 'book' && (
            <section className="card">
              <h2 className="card-title"><Plus size={20} /> Book Appointment</h2>
              <form onSubmit={handleCreateAppointment} className="appointment-form">
                <div className="form-group">
                  <label>Patient <span className="required">*</span></label>
                  <div className="patient-search-wrapper">
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={handlePatientSearch}
                      onFocus={() => setShowPatientSearch(true)}
                      onBlur={() => setTimeout(() => setShowPatientSearch(false), 200)}
                      placeholder="Type patient name or phone (min 3 characters)..."
                      autoComplete="off"
                    />
                    {showPatientSearch && searchResults.length > 0 && (
                      <div className="search-dropdown">
                        {searchResults.map(p => (
                          <div key={p.id} className="search-item" onClick={() => selectPatient(p)}>
                            <div className="search-item-name">{p.name}</div>
                            <div className="search-item-details">
                              <Phone size={12} /> {p.phone}
                              {p.age && <span> • Age {p.age}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPatientSearch && patientSearchTerm.length >= 3 && searchResults.length === 0 && (
                      <div className="search-dropdown">
                        <div className="search-item-empty">
                          No patients found. Patient will be created automatically.
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.patientName && formData.phone && (
                    <p className="selected-patient">
                      <User size={14} /> {formData.patientName} • <Phone size={14} /> {formData.phone}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Doctor <span className="required">*</span></label>
                  <select value={formData.doctor} onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))} required>
                    <option value="">Select doctor</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.doctorName}>
                        {doc.doctorName} {doc.status === 'inactive' ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date <span className="required">*</span></label>
                    <input 
                      type="date" 
                      value={displayToIsoDate(formData.date)} 
                      onChange={(e) => setFormData(prev => ({ ...prev, date: isoToDisplayDate(e.target.value) }))} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Time <span className="required">*</span></label>
                    <select value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))} required>
                      <option value="">Select time</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any notes..." rows="3" />
                </div>

                {!formData.patientName && (
                  <button type="button" className="btn btn-secondary btn-block" onClick={createNewPatient}>
                    Create New Patient
                  </button>
                )}

                <button type="submit" className="btn btn-primary btn-block" disabled={loading || !formData.patientName}>
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'appointments' && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><Calendar size={20} /> All Appointments</h2>
                <button className="btn btn-icon" onClick={() => fetchAllData()} disabled={loading}>
                  <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="empty-state"><Calendar size={48} /> <p>No appointments</p></div>
              ) : (
                <div className="appointments-list">
                  {appointments.map(apt => (
                    <div key={apt.id} className={`appointment-card ${apt.status === 'NotComing' ? 'not-coming' : ''}`}>
                      <div className="appointment-header">
                        <div>
                          <h3>{apt.patientName}</h3>
                          <span className={`badge badge-${apt.status.toLowerCase()}`}>{apt.status}</span>
                        </div>
                        <div className="appointment-actions">
                          <button className="btn-icon" onClick={() => window.open(`https://wa.me/${apt.phone}`, '_blank')} title="WhatsApp">
                            <MessageCircle size={18} />
                          </button>
                          <button className="btn-icon" onClick={() => setExpandedAptId(expandedAptId === apt.id ? null : apt.id)}>
                            {expandedAptId === apt.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="appointment-details">
                        <div><Calendar size={16} /> {apt.displayDate}</div>
                        <div><Clock size={16} /> {apt.time}</div>
                        <div><Phone size={16} /> {apt.phone}</div>
                      </div>

                      {expandedAptId === apt.id && (
                        <div className="appointment-expand">
                          <div className="detail-row"><strong>Doctor:</strong> {apt.doctor}</div>
                          <div className="detail-row"><strong>Created by:</strong> {apt.createdBy}</div>

                          <div className="detail-row">
                            {editingNoteId === apt.id ? (
                              <div className="notes-editor">
                                <textarea value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)} rows="3" />
                                <button className="btn btn-primary btn-sm" onClick={() => handleNoteEdit(apt.id)}>Save</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingNoteId(null)}>Cancel</button>
                              </div>
                            ) : (
                              <div className="notes-view" onClick={() => { setEditingNoteId(apt.id); setEditingNoteText(apt.notes); }}>
                                <FileText size={14} /> {apt.notes || 'Click to add notes'}
                              </div>
                            )}
                          </div>

                          <div className="appointment-footer">
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAppointment(apt.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
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
    );
  }

  if (view === 'doctor' || view === 'head-doctor') {
    const upcoming = getUpcomingAppointments().slice(0, 4);
    const allUpcoming = getUpcomingAppointments();

    return (
      <div className="app-container">
        <header className="dashboard-header">
          <div className="header-content">
            <UserCog size={24} />
            <div>
              <h1>{view === 'doctor' ? 'Doctor' : 'Head Doctor'} Dashboard</h1>
              <p>{currentUser.doctorName}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Logout
          </button>
        </header>

        <div className="tabs">
          <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Calendar size={18} /> Calendar
          </button>
          {view === 'head-doctor' && (
            <>
              <button className={`tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
                <User size={18} /> Patient Master
              </button>
              <button className={`tab ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
                <UserCog size={18} /> Manage Staff
              </button>
              <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
                <Plus size={18} /> Create Appointment
              </button>
            </>
          )}
        </div>

        {error && <div className="alert alert-error">{error}<button onClick={() => setError(null)}>×</button></div>}
        {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess(null)}>×</button></div>}

        <div className="dashboard-content">
          {activeTab === 'dashboard' && (
            <>
              <section className="card">
                <h2 className="card-title"><Clock size={20} /> Upcoming Appointments</h2>
                {upcoming.length === 0 ? (
                  <p className="text-muted">No upcoming appointments</p>
                ) : (
                  <div className="upcoming-list">
                    {(showAllUpcoming ? allUpcoming : upcoming).map(apt => (
                      <div key={apt.id} className="upcoming-item">
                        <div className="upcoming-patient">{apt.patientName}</div>
                        <div className="upcoming-time">{apt.displayDate} at {apt.time}</div>
                        <button className="btn-icon-small" onClick={() => window.open(`https://wa.me/${apt.phone}`, '_blank')}>
                          <MessageCircle size={14} />
                        </button>
                      </div>
                    ))}
                    {!showAllUpcoming && allUpcoming.length > 4 && (
                      <button className="btn btn-secondary btn-block" onClick={() => setShowAllUpcoming(true)}>
                        Show All ({allUpcoming.length})
                      </button>
                    )}
                  </div>
                )}
              </section>

              <section className="card">
                <h2 className="card-title"><Calendar size={20} /> Appointments by Date</h2>
                <div className="calendar-view">
                  {[...new Set(getVisibleAppointments().map(a => a.displayDate))].sort().map(date => (
                    <div key={date} className="calendar-date" onClick={() => setSelectedDate(selectedDate === date ? null : date)}>
                      <div className="date-label">{date}</div>
                      <div className="date-count">{getAppointmentsForDate(date).length} appts</div>

                      {selectedDate === date && (
                        <div className="date-appointments">
                          {getAppointmentsForDate(date).map(apt => (
                            <div key={apt.id} className="date-apt">
                              <div>{apt.time} - {apt.patientName}</div>
                              <div className="text-small">{apt.status}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {view === 'head-doctor' && activeTab === 'patients' && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><User size={20} /> Patient Master</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setFormData({
                      patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: ''
                    });
                    setActiveTab('add-patient');
                  }}
                >
                  <Plus size={18} /> Add Patient
                </button>
              </div>
              <div className="patients-table">
                {patients.length === 0 ? (
                  <p className="text-muted">No patients</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Age</th>
                        <th>Last Appt</th>
                        <th>Upcoming Appt</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.phone}</td>
                          <td>{p.age}</td>
                          <td>{p.lastAppointment || '-'}</td>
                          <td>{p.upcomingAppointment || '-'}</td>
                          <td>
                            {p.googleDocLink && (
                              <a href={p.googleDocLink} target="_blank" rel="noopener noreferrer" className="btn-link">View Doc</a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'add-patient' && (
            <section className="card">
              <h2 className="card-title"><User size={20} /> Add New Patient</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.patientName || !formData.phone) {
                  setError('Patient name and phone are required');
                  return;
                }
                setLoading(true);
                const result = await createPatient({
                  name: formData.patientName,
                  phone: formData.phone,
                  gender: formData.gender,
                  dob: formData.dob,
                  googleDocLink: ''
                });
                setLoading(false);
                if (result.success) {
                  setSuccess('Patient added successfully!');
                  resetForm();
                  await fetchAllData();
                  setActiveTab('patients');
                  setTimeout(() => setSuccess(null), 3000);
                } else {
                  setError(result.error || 'Failed to add patient');
                }
              }} className="appointment-form">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={formData.patientName} 
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))} 
                    required 
                    placeholder="Patient full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone <span className="required">*</span></label>
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} 
                    required 
                    placeholder="Phone number"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input 
                      type="date" 
                      value={displayToIsoDate(formData.dob)} 
                      onChange={(e) => setFormData(prev => ({ ...prev, dob: isoToDisplayDate(e.target.value) }))} 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('patients')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Patient'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'staff' && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><UserCog size={20} /> Manage Staff</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setFormData({
                      patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: ''
                    });
                    setActiveTab('add-staff');
                  }}
                >
                  <Plus size={18} /> Add Staff
                </button>
              </div>
              <div className="patients-table">
                {doctors.length === 0 ? (
                  <p className="text-muted">No staff members</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Role</th>
                        <th>Doctor Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.id}</td>
                          <td>{doc.role}</td>
                          <td>{doc.doctorName || '-'}</td>
                          <td>
                            <span className={`badge ${doc.status === 'active' ? 'badge-arrived' : 'badge-completed'}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={async () => {
                                const newStatus = doc.status === 'active' ? 'inactive' : 'active';
                                const result = await updateUser(doc.id, { status: newStatus });
                                if (result.success) {
                                  setSuccess(`Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
                                  await fetchAllData();
                                  setTimeout(() => setSuccess(null), 2000);
                                } else {
                                  setError(result.error);
                                }
                              }}
                            >
                              {doc.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'add-staff' && (
            <section className="card">
              <h2 className="card-title"><UserCog size={20} /> Add New Staff</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const staffId = e.target.staffId.value.trim();
                const staffPassword = e.target.staffPassword.value.trim();
                const staffRole = e.target.staffRole.value;
                const staffDoctorName = e.target.staffDoctorName?.value?.trim() || '';

                if (!staffId || !staffPassword || !staffRole) {
                  setError('ID, password, and role are required');
                  return;
                }

                setLoading(true);
                const result = await createUser({
                  id: staffId,
                  password: staffPassword,
                  role: staffRole,
                  doctorName: staffDoctorName
                });
                setLoading(false);

                if (result.success) {
                  setSuccess('Staff member added successfully!');
                  await fetchAllData();
                  setActiveTab('staff');
                  setTimeout(() => setSuccess(null), 3000);
                } else {
                  setError(result.error || 'Failed to add staff');
                }
              }} className="appointment-form">
                <div className="form-group">
                  <label>Login ID <span className="required">*</span></label>
                  <input 
                    type="text" 
                    name="staffId"
                    required 
                    placeholder="e.g., nurse1, drsmith"
                  />
                </div>
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input 
                    type="password" 
                    name="staffPassword"
                    required 
                    placeholder="Enter password"
                  />
                </div>
                <div className="form-group">
                  <label>Role <span className="required">*</span></label>
                  <select name="staffRole" required>
                    <option value="">Select role</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="head-doctor">Head Doctor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Doctor Name (if role is doctor/head-doctor)</label>
                  <input 
                    type="text" 
                    name="staffDoctorName"
                    placeholder="e.g., Dr. Smith"
                  />
                </div>
                <div className="form-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('staff')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'book' && (
            <section className="card">
              <h2 className="card-title"><Plus size={20} /> Create Appointment</h2>
              <form onSubmit={handleCreateAppointment} className="appointment-form">
                <div className="form-group">
                  <label>Doctor (default: you)</label>
                  <select value={formData.doctor} onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}>
                    <option value="">{currentUser.doctorName}</option>
                    {doctors.filter(d => d.id !== currentUser.id).map(doc => (
                      <option key={doc.id} value={doc.doctorName}>{doc.doctorName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Patient</label>
                  <div className="patient-search-wrapper">
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={handlePatientSearch}
                      onFocus={() => setShowPatientSearch(true)}
                      onBlur={() => setTimeout(() => setShowPatientSearch(false), 200)}
                      placeholder="Type patient name or phone (min 3 characters)..."
                      autoComplete="off"
                    />
                    {showPatientSearch && searchResults.length > 0 && (
                      <div className="search-dropdown">
                        {searchResults.map(p => (
                          <div key={p.id} className="search-item" onClick={() => selectPatient(p)}>
                            <div className="search-item-name">{p.name}</div>
                            <div className="search-item-details">
                              <Phone size={12} /> {p.phone}
                              {p.age && <span> • Age {p.age}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPatientSearch && patientSearchTerm.length >= 3 && searchResults.length === 0 && (
                      <div className="search-dropdown">
                        <div className="search-item-empty">
                          No patients found. Patient will be created automatically.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={displayToIsoDate(formData.date)} 
                      onChange={(e) => setFormData(prev => ({ ...prev, date: isoToDisplayDate(e.target.value) }))} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <select value={formData.time} onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}>
                      <option value="">Select time</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Appointment'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    );
  }
}

export default App;
