import { useState, useEffect } from 'react';
import {
  User, UserCog, Calendar, Clock, Phone, FileText, CheckCircle, Plus, LogOut, RefreshCw,
  Edit2, Trash2, Home, MessageCircle, Search, X, ChevronDown, ChevronUp, Eye, EyeOff,
  ChevronLeft, ChevronRight, Save, XCircle, ExternalLink
} from 'lucide-react';
import {
  login, getAppointments, createAppointment, updateAppointment, deleteAppointment,
  getPatients, createPatient, updatePatient, getDoctors, createUser, updateUser,
  getTodayDate, getTodayDateISO, getTodayBackendDate, toDisplayDate, toBackendDate, 
  generateTimeSlots, isoToDisplayDate, displayToIsoDate
} from './services/api';
import './App.css';

// Helper: Calculate age from DD-MM-YYYY format
const calculateAge = (dob) => {
  if (!dob || dob.length < 10) return '';
  const [day, month, year] = dob.split('-').map(Number);
  if (!day || !month || !year) return '';
  
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : '';
};

const formatTimeDisplay = (value) => {
  if (!value) return '';
  if (String(value).includes('T')) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value))) {
    const parts = String(value).split(':');
    return `${parts[0].padStart(2,'0')}:${parts[1].padStart(2,'0')}`;
  }
  return String(value);
};

const getPatientDocLink = (patients, phone, name) => {
  if (!patients) return '';
  const byPhone = patients.find(p => p.phone && phone && p.phone === phone);
  if (byPhone && byPhone.googleDocLink) return byPhone.googleDocLink;
  const byName = patients.find(p => p.name && name && p.name.toLowerCase() === name.toLowerCase());
  return byName?.googleDocLink || '';
};

// Session storage helpers (7-day expiry)
const saveSession = (user) => {
  const session = {
    user,
    expiry: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  localStorage.setItem('clinicSession', JSON.stringify(session));
};

const getSession = () => {
  const sessionStr = localStorage.getItem('clinicSession');
  if (!sessionStr) return null;
  
  const session = JSON.parse(sessionStr);
  if (Date.now() > session.expiry) {
    localStorage.removeItem('clinicSession');
    return null;
  }
  
  return session.user;
};

const clearSession = () => {
  localStorage.removeItem('clinicSession');
};

// Calendar helper: Generate calendar grid for a given month/year
const generateCalendarGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  
  const grid = [];
  let week = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    week.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  
  // Add remaining empty cells
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    grid.push(week);
  }
  
  return grid;
};

function App() {
  const [view, setView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('view'); // Default for nurse: 'view'
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedAptId, setExpandedAptId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingAptId, setEditingAptId] = useState(null);
  const [editingPatientData, setEditingPatientData] = useState(null);
  const [editingStaffData, setEditingStaffData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [expandedCalendarDate, setExpandedCalendarDate] = useState(null);
  const [showGenderDob, setShowGenderDob] = useState(false);
  const [showNewPatientFields, setShowNewPatientFields] = useState(false);
  const [creatingNewPatient, setCreatingNewPatient] = useState(false);
  const [editingAptData, setEditingAptData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalType, setModalType] = useState(null); // 'appointment', 'patient'
  const [formData, setFormData] = useState({
    patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: '', googleDocLink: ''
  });

  const timeSlots = generateTimeSlots();

  // Session persistence: Check on mount
  useEffect(() => {
    const savedUser = getSession();
    if (savedUser) {
      setCurrentUser(savedUser);
      setView(savedUser.role);
      fetchAllData();
      
      // Set default tab based on role
      if (savedUser.role === 'doctor' || savedUser.role === 'head-doctor' || savedUser.role === 'nurse') {
        setActiveTab('calendar');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const { loginId, loginPassword } = e.target.elements;
    
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
      const result = await login(loginId.value.trim(), loginPassword.value);
      setLoading(false);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setView(result.user.role);
        saveSession(result.user); // Save to localStorage with 7-day expiry
        await fetchAllData();
        
        // Set default tab based on role
        if (result.user.role === 'doctor' || result.user.role === 'head-doctor' || result.user.role === 'nurse') {
          setActiveTab('calendar');
        }
        
        setSuccess('Logged in successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorMsg = result.error || 'Invalid login credentials. Please check your ID and password.';
        setError(errorMsg);
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = 'Connection error. Please verify: 1) Google Apps Script is deployed 2) Users sheet exists with your credentials';
      setError(errorMsg);
    }
  };

  const handleLogout = () => {
    clearSession(); // Clear localStorage
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
      patientName: '', phone: '', date: getTodayDate(), time: '', gender: '', dob: '', notes: '', doctor: '', googleDocLink: ''
    });
    setShowPatientSearch(false);
    setPatientSearchTerm('');
    setSearchResults([]);
    setShowGenderDob(false);
  };

  const handlePatientSearch = async (e) => {
    const term = e.target.value;
    setPatientSearchTerm(term);
    setFormData(prev => ({ ...prev, patientName: term }));
    
    if (term.length >= 3) {
      const result = await getPatients(term);
      const resultsArray = result.success ? result.patients : [];
      setSearchResults(resultsArray);
      setShowPatientSearch(resultsArray.length > 0);
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
      gender: patient.gender || '',
      dob: patient.dob || ''
    }));
    setPatientSearchTerm(patient.name);
    setShowPatientSearch(false);
    setSearchResults([]);
    setShowGenderDob(true); // Show gender/DOB fields after selection
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Determine doctor name
    let doctorName = '';
    if (currentUser.role === 'doctor') {
      doctorName = currentUser.doctorName;
    } else if (currentUser.role === 'head-doctor') {
      doctorName = formData.doctor || currentUser.doctorName;
    } else if (currentUser.role === 'nurse') {
      if (!formData.doctor) {
        setError('Please select a doctor');
        setLoading(false);
        return;
      }
      doctorName = formData.doctor;
    }

    // Client-side double-booking guard
    const conflict = appointments.find(a =>
      a.doctor === doctorName &&
      a.date === toBackendDate(formData.date) &&
      formatTimeDisplay(a.time) === formatTimeDisplay(formData.time) &&
      a.status !== 'NotComing'
    );
    if (conflict) {
      setLoading(false);
      setError('This slot is already booked for this doctor.');
      return;
    }

    const result = await createAppointment({
      patientName: formData.patientName,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      doctor: doctorName,
      notes: formData.notes, // Include notes
      createdBy: currentUser.id
    });

    setLoading(false);
    if (result.success) {
      setSuccess('Appointment booked successfully!');
      
      // Instant refresh: append new appointment to state
      if (result.appointment) {
        setAppointments(prev => [...prev, result.appointment]);
      }
      
      resetForm();
      await fetchAllData(); // refresh metadata (last/upcoming)
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to book appointment');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleStatusChange = async (apt, newStatus) => {
    const result = await updateAppointment(apt.id, { status: newStatus, updatedBy: currentUser.id });
    if (result.success) {
      setSuccess(`Appointment marked as ${newStatus}`);
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: newStatus } : a));
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
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, notes: editingNoteText } : a));
    } else {
      setError(result.error);
    }
  };

  const handleEditAppointment = async (apt) => {
    if (!editingAptData) return;
    
    const updateData = {
      updatedBy: currentUser.id
    };
    
    // Only include fields that exist in editingAptData
    if (editingAptData.status !== undefined) updateData.status = editingAptData.status;
    if (editingAptData.notes !== undefined) updateData.notes = editingAptData.notes;
    if (editingAptData.date !== undefined && editingAptData.time !== undefined) {
      updateData.date = editingAptData.date;
      updateData.time = editingAptData.time;
    }
    
    const result = await updateAppointment(apt.id, updateData);
    
    if (result.success) {
      setSuccess('Appointment updated successfully');
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, ...editingAptData } : a));
      setEditingAptId(null);
      setEditingAptData(null);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(result.error);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    const result = await deleteAppointment(id);
    if (result.success) {
      setSuccess('Appointment deleted');
      setAppointments(prev => prev.filter(a => a.id !== id));
    } else {
      setError(result.error);
    }
  };

  const handleCreatePatient = async (patientData) => {
    setLoading(true);
    const result = await createPatient(patientData);
    setLoading(false);

    if (result.success) {
      setSuccess('Patient created successfully!');
      
      // Instant refresh: append new patient to state
      if (result.patient) {
        setPatients(prev => [...prev, result.patient]);
        
        // If creating from book appointment search, auto-fill form and update search results
        if (creatingNewPatient) {
          setSearchResults([result.patient]);
          selectPatient(result.patient);
          setCreatingNewPatient(false);
        }
      }
      
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } else {
      setError(result.error || 'Failed to create patient');
      return false;
    }
  };

  const handleUpdatePatient = async (id, data) => {
    const result = await updatePatient(id, data);
    if (result.success) {
      setSuccess('Patient updated successfully!');
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      setEditingPatientId(null);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(result.error || 'Failed to update patient');
    }
  };

  const handleCreateUser = async (userData) => {
    setLoading(true);
    const result = await createUser(userData);
    setLoading(false);

    if (result.success) {
      setSuccess('Staff member added successfully!');
      
      // Instant refresh: append new user to state
      if (result.user) {
        setDoctors(prev => [...prev, result.user]);
      }
      
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } else {
      setError(result.error || 'Failed to add staff');
      return false;
    }
  };

  const handleUpdateUser = async (id, data) => {
    const result = await updateUser(id, data);
    if (result.success) {
      setSuccess('Staff updated successfully!');
      setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
      setEditingStaffId(null);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(result.error || 'Failed to update staff');
    }
  };

  const getVisibleAppointments = () => {
    let filtered = appointments;
    if (currentUser.role === 'doctor') {
      filtered = filtered.filter(apt => apt.doctor === currentUser.doctorName);
    }
    return filtered;
  };

  const getAppointmentsForCalendarDate = (day) => {
    if (!day) return [];
    const dateStr = `${String(day).padStart(2, '0')}-${String(currentMonth + 1).padStart(2, '0')}-${currentYear}`;
    const backendDate = toBackendDate(dateStr);
    return getVisibleAppointments().filter(apt => apt.date === backendDate);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const calendarGrid = generateCalendarGrid(currentYear, currentMonth);

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
          <button className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={18} /> Calendar
          </button>
          <button className={`tab ${activeTab === 'view' ? 'active' : ''}`} onClick={() => setActiveTab('view')}>
            <Calendar size={18} /> View Appointments
          </button>
          <button className={`tab ${activeTab === 'book' ? 'active' : ''}`} onClick={() => setActiveTab('book')}>
            <Plus size={18} /> Book Appointment
          </button>
        </div>

        {error && <div className="alert alert-error">{error}<button onClick={() => setError(null)}>×</button></div>}
        {success && <div className="alert alert-success">{success}<button onClick={() => setSuccess(null)}>×</button></div>}

        <div className="dashboard-content">
          {activeTab === 'calendar' && (
            <section className="card">
              <div className="calendar-header">
                <button className="btn-icon" onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}>
                  <ChevronLeft size={20} />
                </button>
                <h2>{monthNames[currentMonth]} {currentYear}</h2>
                <button className="btn-icon" onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {calendarGrid.map((week, weekIdx) => (
                  <div key={weekIdx} className="calendar-week">
                    {week.map((day, dayIdx) => {
                      const aptsForDay = day ? getAppointmentsForCalendarDate(day) : [];
                      const dateKey = day ? `${day}-${currentMonth}-${currentYear}` : `empty-${weekIdx}-${dayIdx}`;
                      const isExpanded = expandedCalendarDate === dateKey;
                      
                      return (
                        <div 
                          key={dateKey} 
                          className={`calendar-day ${!day ? 'empty' : ''} ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => day && setExpandedCalendarDate(isExpanded ? null : dateKey)}
                        >
                          {day && (
                            <>
                              <div className="day-number">{day}</div>
                              <div className="day-count">{aptsForDay.length} appt{aptsForDay.length !== 1 ? 's' : ''}</div>
                              
                              {isExpanded && aptsForDay.length > 0 && (
                                <div className="day-appointments">
                                  {aptsForDay.map(apt => (
                                    <div key={apt.id} className="day-apt-item">
                                      <div className="day-apt-time">{formatTimeDisplay(apt.time)}</div>
                                      <div className="day-apt-name">{apt.patientName}</div>
                                      <div className={`day-apt-status status-${apt.status.toLowerCase()}`}>{apt.status}</div>
                                      {(() => {
                                        const link = getPatientDocLink(patients, apt.phone, apt.patientName);
                                        return link ? (
                                          <button 
                                            className="btn-icon btn-sm" 
                                            onClick={(e) => { e.stopPropagation(); window.open(link, '_blank'); }}
                                            title="View patient history"
                                          >
                                            <ExternalLink size={12} />
                                          </button>
                                        ) : null;
                                      })()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'book' && (
            <section className="card">
              <h2 className="card-title"><Plus size={20} /> Book Appointment</h2>
              <form onSubmit={handleCreateAppointment} className="appointment-form">
                <div className="form-group">
                  <label>Patient Name <span className="required">*</span></label>
                  <div className="patient-search-wrapper">
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={handlePatientSearch}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowPatientSearch(true);
                      }}
                      onBlur={() => setTimeout(() => setShowPatientSearch(false), 200)}
                      placeholder="Type patient name (min 3 characters)..."
                      autoComplete="off"
                      required
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
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Patient phone number"
                    required
                  />
                </div>

                {showGenderDob && (
                  <>
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
                  </>
                )}

                {!showGenderDob && patientSearchTerm.length >= 3 && searchResults.length === 0 && (
                  <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#856404' }}>No patient found</p>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-block"
                      onClick={() => {
                        setShowGenderDob(true);
                        setCreatingNewPatient(true);
                      }}
                    >
                      <Plus size={16} /> Create New Patient
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label>Doctor <span className="required">*</span></label>
                  <select value={formData.doctor} onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))} required>
                    <option value="">Select doctor</option>
                    {doctors.filter(d => d.status === 'active' && (d.role === 'doctor' || d.role === 'head-doctor')).map(doc => (
                      <option key={doc.id} value={doc.doctorName}>
                        {doc.doctorName}
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

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'view' && (
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
                <div className="appointments-table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Doctor</th>
                        <th>Status</th>
                        <th>WhatsApp</th>
                        <th>Notes</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(apt => (
                        <tr key={apt.id}>
                          <td>{apt.patientName}</td>
                          <td>
                            {editingAptId === apt.id ? (
                              <input 
                                type="date" 
                                value={displayToIsoDate(editingAptData?.displayDate || apt.displayDate)}
                                onChange={(e) => {
                                  const newDate = isoToDisplayDate(e.target.value);
                                  setEditingAptData(prev => ({ ...prev, displayDate: newDate, date: toBackendDate(newDate) }));
                                }}
                              />
                            ) : apt.displayDate}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <select 
                                value={editingAptData?.time || apt.time}
                                onChange={(e) => setEditingAptData(prev => ({ ...prev, time: e.target.value }))}
                              >
                                {timeSlots.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            ) : formatTimeDisplay(apt.time)}
                          </td>
                          <td>{apt.doctor || '-'}</td>
                          <td>
                            {editingAptId === apt.id ? (
                              <select 
                                value={editingAptData?.status || apt.status}
                                onChange={(e) => setEditingAptData(prev => ({ ...prev, status: e.target.value }))}
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Arrived">Arrived</option>
                                <option value="NotComing">Not Coming</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <select 
                                value={apt.status} 
                                onChange={(e) => handleStatusChange(apt, e.target.value)}
                                className="status-select"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Arrived">Arrived</option>
                                <option value="NotComing">Not Coming</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn-icon" 
                              onClick={() => window.open(`https://wa.me/${apt.phone}`, '_blank')}
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                          </td>
                          <td className="notes-cell">
                            {editingNoteId === apt.id ? (
                              <div className="inline-edit">
                                <input 
                                  type="text" 
                                  value={editingNoteText} 
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                />
                                <button className="btn-sm" onClick={() => handleNoteEdit(apt.id)}><Save size={14} /></button>
                                <button className="btn-sm" onClick={() => setEditingNoteId(null)}><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingNoteId(apt.id); setEditingNoteText(apt.notes || ''); }}>
                                {apt.notes || 'Click to add'}
                              </span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm" 
                              onClick={() => { 
                                setEditingAptId(apt.id); 
                                setEditingAptData({ 
                                  displayDate: apt.displayDate, 
                                  date: apt.date, 
                                  time: apt.time, 
                                  type: apt.type || '', 
                                  notes: apt.notes || '', 
                                  status: apt.status 
                                }); 
                                setModalType('appointment');
                                setShowEditModal(true);
                              }}
                              disabled={apt.status === 'Completed' || apt.status === 'NotComing'}
                              title={apt.status === 'Completed' || apt.status === 'NotComing' ? 'Cannot edit completed or not coming appointments' : 'Edit appointment'}
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && modalType === 'appointment' && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><Edit2 size={20} /> Edit Appointment</h3>
                <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Date <span className="required">*</span></label>
                  <input 
                    type="date" 
                    value={displayToIsoDate(editingAptData?.displayDate || '')}
                    onChange={(e) => {
                      const newDate = isoToDisplayDate(e.target.value);
                      setEditingAptData(prev => ({ ...prev, displayDate: newDate, date: toBackendDate(newDate) }));
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time <span className="required">*</span></label>
                  <select 
                    value={editingAptData?.time || ''}
                    onChange={(e) => setEditingAptData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={editingAptData?.status || 'Scheduled'}
                    onChange={(e) => setEditingAptData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Arrived">Arrived</option>
                    <option value="NotComing">Not Coming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <input 
                    type="text" 
                    value={editingAptData?.type || ''}
                    onChange={(e) => setEditingAptData(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="Appointment type"
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={editingAptData?.notes || ''}
                    onChange={(e) => setEditingAptData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setShowEditModal(false);
                  setEditingAptId(null);
                  setEditingAptData(null);
                }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={async () => {
                  const apt = appointments.find(a => a.id === editingAptId);
                  if (apt) {
                    await handleEditAppointment(apt);
                    setShowEditModal(false);
                  }
                }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'doctor' || view === 'head-doctor') {
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
          <button className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={18} /> Calendar
          </button>
          {view === 'head-doctor' && (
            <>
              <button className={`tab ${activeTab === 'manage-patients' ? 'active' : ''}`} onClick={() => setActiveTab('manage-patients')}>
                <User size={18} /> Manage Patients
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
          {activeTab === 'calendar' && (
            <section className="card">
              <div className="calendar-header">
                <button className="btn-icon" onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}>
                  <ChevronLeft size={20} />
                </button>
                <h2>{monthNames[currentMonth]} {currentYear}</h2>
                <button className="btn-icon" onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}>
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {calendarGrid.map((week, weekIdx) => (
                  <div key={weekIdx} className="calendar-week">
                    {week.map((day, dayIdx) => {
                      const aptsForDay = day ? getAppointmentsForCalendarDate(day) : [];
                      const dateKey = day ? `${day}-${currentMonth}-${currentYear}` : `empty-${weekIdx}-${dayIdx}`;
                      const isExpanded = expandedCalendarDate === dateKey;
                      
                      return (
                        <div 
                          key={dateKey} 
                          className={`calendar-day ${!day ? 'empty' : ''} ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => day && setExpandedCalendarDate(isExpanded ? null : dateKey)}
                        >
                          {day && (
                            <>
                              <div className="day-number">{day}</div>
                              <div className="day-count">{aptsForDay.length} appt{aptsForDay.length !== 1 ? 's' : ''}</div>
                              
                              {isExpanded && aptsForDay.length > 0 && (
                                <div className="day-appointments">
                                  {aptsForDay.map(apt => (
                                    <div key={apt.id} className="day-apt-item">
                                      <div className="day-apt-time">{formatTimeDisplay(apt.time)}</div>
                                      <div className="day-apt-name">{apt.patientName}</div>
                                      <div className={`day-apt-status status-${apt.status.toLowerCase()}`}>{apt.status}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px' }}>
                <h3>All Appointments</h3>
                <div className="appointments-table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>WhatsApp</th>
                        <th>History</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleAppointments().map(apt => (
                        <tr key={apt.id}>
                          <td>
                            {apt.patientName}
                            {view === 'head-doctor' && (
                              <button 
                                className="btn-icon" 
                                style={{ marginLeft: '5px' }}
                                onClick={() => {
                                  const patient = patients.find(p => p.phone === apt.phone || p.name.toLowerCase() === apt.patientName.toLowerCase());
                                  if (patient) {
                                    setEditingPatientId(patient.id);
                                    setEditingPatientData(patient);
                                    setModalType('patient');
                                    setShowEditModal(true);
                                  }
                                }}
                                title="Edit patient details"
                              >
                                <User size={14} />
                              </button>
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <input 
                                type="date" 
                                defaultValue={displayToIsoDate(apt.displayDate)}
                                onChange={(e) => {
                                  const newDate = isoToDisplayDate(e.target.value);
                                  setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, displayDate: newDate, date: toBackendDate(newDate) } : a));
                                }}
                              />
                            ) : (
                              apt.displayDate
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <select 
                                defaultValue={apt.time}
                                onChange={(e) => {
                                  setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, time: e.target.value } : a));
                                }}
                              >
                                {timeSlots.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            ) : (
                              formatTimeDisplay(apt.time)
                            )}
                          </td>
                          <td>
                            <select 
                              value={apt.status} 
                              onChange={(e) => handleStatusChange(apt, e.target.value)}
                              className="status-select"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Arrived">Arrived</option>
                              <option value="NotComing">Not Coming</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              className="btn-icon" 
                              onClick={() => window.open(`https://wa.me/${apt.phone}`, '_blank')}
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                          </td>
                          <td>
                            {(() => {
                              const link = getPatientDocLink(patients, apt.phone, apt.patientName);
                              return (
                                <button 
                                  className="btn-icon" 
                                  onClick={() => link && window.open(link, '_blank')}
                                  disabled={!link}
                                  title={link ? 'Open history' : 'No history link'}
                                >
                                  History
                                </button>
                              );
                            })()}
                          </td>
                          <td className="notes-cell">
                            {editingNoteId === apt.id ? (
                              <div className="inline-edit">
                                <input 
                                  type="text" 
                                  value={editingNoteText} 
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                />
                                <button className="btn-sm" onClick={() => handleNoteEdit(apt.id)}><Save size={14} /></button>
                                <button className="btn-sm" onClick={() => setEditingNoteId(null)}><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingNoteId(apt.id); setEditingNoteText(apt.notes || ''); }}>
                                {apt.notes || 'Click to add'}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <>
                                <button 
                                  className="btn btn-sm btn-primary" 
                                  onClick={async () => {
                                    const aptData = appointments.find(a => a.id === apt.id);
                                    const result = await updateAppointment(apt.id, {
                                      date: aptData.date,
                                      time: aptData.time,
                                      notes: aptData.notes,
                                      status: aptData.status,
                                      updatedBy: currentUser.id
                                    });
                                    if (result.success) {
                                      setSuccess('Appointment updated');
                                      setEditingAptId(null);
                                      await fetchAllData();
                                      setTimeout(() => setSuccess(null), 2000);
                                    } else {
                                      setError(result.error);
                                    }
                                  }}
                                >
                                  <Save size={14} />
                                </button>
                                <button className="btn btn-sm" onClick={() => setEditingAptId(null)}>
                                  <XCircle size={14} />
                                </button>
                              </>
                            ) : (
                              <button className="btn btn-sm" onClick={() => setEditingAptId(apt.id)}>
                                <Edit2 size={14} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'appointments' && (
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
                <div className="appointments-table-wrapper">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>WhatsApp</th>
                        <th>History</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getVisibleAppointments().map(apt => (
                        <tr key={apt.id}>
                          <td>{apt.patientName}</td>
                          <td>
                            {editingAptId === apt.id ? (
                              <input 
                                type="date" 
                                value={displayToIsoDate(editingAptData?.displayDate || apt.displayDate)}
                                onChange={(e) => {
                                  const newDate = isoToDisplayDate(e.target.value);
                                  setEditingAptData(prev => ({ ...prev, displayDate: newDate, date: toBackendDate(newDate) }));
                                }}
                              />
                            ) : (
                              apt.displayDate
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <select 
                                value={editingAptData?.time || apt.time}
                                onChange={(e) => setEditingAptData(prev => ({ ...prev, time: e.target.value }))}
                              >
                                {timeSlots.map(slot => (
                                  <option key={slot} value={slot}>{slot}</option>
                                ))}
                              </select>
                            ) : (
                              formatTimeDisplay(apt.time)
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <select 
                                value={editingAptData?.status || apt.status}
                                onChange={(e) => setEditingAptData(prev => ({ ...prev, status: e.target.value }))}
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Arrived">Arrived</option>
                                <option value="NotComing">Not Coming</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <select 
                                value={apt.status} 
                                onChange={(e) => handleStatusChange(apt, e.target.value)}
                                className="status-select"
                              >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Arrived">Arrived</option>
                                <option value="NotComing">Not Coming</option>
                                <option value="Completed">Completed</option>
                              </select>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn-icon" 
                              onClick={() => window.open(`https://wa.me/${apt.phone}`, '_blank')}
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                          </td>
                          <td>
                            {(() => {
                              const link = getPatientDocLink(patients, apt.phone, apt.patientName);
                              return (
                                <button 
                                  className="btn-icon" 
                                  onClick={() => link && window.open(link, '_blank')}
                                  disabled={!link}
                                  title={link ? 'Open history' : 'No history link'}
                                >
                                  History
                                </button>
                              );
                            })()}
                          </td>
                          <td className="notes-cell">
                            {editingNoteId === apt.id ? (
                              <div className="inline-edit">
                                <input 
                                  type="text" 
                                  value={editingNoteText} 
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                />
                                <button className="btn-sm" onClick={() => handleNoteEdit(apt.id)}><Save size={14} /></button>
                                <button className="btn-sm" onClick={() => setEditingNoteId(null)}><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingNoteId(apt.id); setEditingNoteText(apt.notes || ''); }}>
                                {apt.notes || 'Click to add'}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingAptId === apt.id ? (
                              <div className="inline-edit">
                                <button 
                                  className="btn-sm" 
                                  onClick={() => handleEditAppointment(apt)}
                                >
                                  <Save size={14} />
                                </button>
                                <button 
                                  className="btn-sm" 
                                  onClick={() => { 
                                    setEditingAptId(null); 
                                    setEditingAptData(null); 
                                  }}
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-sm" 
                                onClick={() => { 
                                  setEditingAptId(apt.id); 
                                  setEditingAptData({ 
                                    displayDate: apt.displayDate, 
                                    date: apt.date, 
                                    time: apt.time, 
                                    type: apt.type || '', 
                                    notes: apt.notes || '', 
                                    status: apt.status 
                                  }); 
                                }}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {view === 'head-doctor' && activeTab === 'manage-patients' && (
            <section className="card">
              <div className="card-header">
                <h2 className="card-title"><User size={20} /> Manage Patients</h2>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setEditingPatientId('new');
                    setEditingPatientData({
                      name: '',
                      phone: '',
                      dob: '',
                      googleDocLink: ''
                    });
                    setModalType('patient');
                    setShowEditModal(true);
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
                        <th>DOB</th>
                        <th>Age</th>
                        <th>Google Doc Link</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.phone}</td>
                          <td>{p.dob || '-'}</td>
                          <td>{p.age || calculateAge(p.dob) || '-'}</td>
                          <td>
                            {p.googleDocLink ? (
                              <a href={p.googleDocLink} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /></a>
                            ) : '-'}
                          </td>
                          <td>
                            <button className="btn-icon" onClick={() => { 
                              setEditingPatientId(p.id); 
                              setEditingPatientData(p); 
                              setModalType('patient');
                              setShowEditModal(true);
                            }} title="Edit patient">
                              <Edit2 size={16} />
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
                            {editingStaffId === doc.id ? (
                              <div className="inline-edit">
                                <input
                                  type="text"
                                  value={editingStaffData?.doctorName || ''}
                                  onChange={(e) => setEditingStaffData(prev => ({ ...prev, doctorName: e.target.value }))}
                                  placeholder="Doctor name"
                                />
                                <button className="btn-sm" onClick={async () => {
                                  const result = await updateUser(doc.id, editingStaffData);
                                  if (result.success) {
                                    setSuccess('Staff updated successfully!');
                                    await fetchAllData();
                                    setEditingStaffId(null);
                                    setEditingStaffData(null);
                                    setTimeout(() => setSuccess(null), 2000);
                                  } else {
                                    setError(result.error);
                                  }
                                }}><Save size={14} /></button>
                                <button className="btn-sm" onClick={() => { setEditingStaffId(null); setEditingStaffData(null); }}><XCircle size={14} /></button>
                              </div>
                            ) : (
                              <>
                                <button className="btn btn-sm" onClick={() => { setEditingStaffId(doc.id); setEditingStaffData(doc); }}>
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  className="btn btn-secondary btn-sm" 
                                  disabled={doc.role === 'head-doctor'}
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
                              </>
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
                  <label>Patient Name <span className="required">*</span></label>
                  <div className="patient-search-wrapper">
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={(e) => {
                        const term = e.target.value;
                        setPatientSearchTerm(term);
                        setFormData(prev => ({ ...prev, patientName: term }));
                        
                        if (term.length >= 3) {
                          getPatients(term).then(result => {
                            const results = result.success ? result.patients : [];
                            setSearchResults(results);
                            setShowPatientSearch(true);
                            if (results.length === 0) {
                              setShowNewPatientFields(true);
                            } else {
                              setShowNewPatientFields(false);
                            }
                          });
                        } else {
                          setSearchResults([]);
                          setShowPatientSearch(false);
                          setShowNewPatientFields(false);
                        }
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowPatientSearch(true);
                      }}
                      onBlur={() => setTimeout(() => setShowPatientSearch(false), 200)}
                      placeholder="Type patient name or phone (min 3 characters)..."
                      autoComplete="off"
                      required
                    />
                    {showPatientSearch && searchResults.length > 0 && (
                      <div className="search-dropdown">
                        {searchResults.map(p => (
                          <div key={p.id} className="search-item" onClick={() => {
                            selectPatient(p);
                            setShowNewPatientFields(false);
                          }}>
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
                          <p style={{ marginBottom: '10px' }}>No patient found</p>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm" 
                            onClick={() => {
                              setShowNewPatientFields(true);
                              setCreatingNewPatient(true);
                              setShowPatientSearch(false);
                            }}
                            style={{ width: '100%' }}
                          >
                            <Plus size={14} /> Create New Patient
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Patient phone number"
                    required
                  />
                </div>

                {showNewPatientFields && (
                  <div style={{ padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #87ceeb', borderRadius: '4px', marginBottom: '10px' }}>
                    <h4 style={{ marginTop: 0 }}>Create New Patient</h4>
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
                    <div className="form-group">
                      <label>Google Doc Link</label>
                      <input 
                        type="url" 
                        value={formData.googleDocLink || ''} 
                        onChange={(e) => setFormData(prev => ({ ...prev, googleDocLink: e.target.value }))} 
                        placeholder="https://docs.google.com/..."
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-block" 
                      onClick={async () => {
                        if (!formData.patientName || !formData.phone) {
                          setError('Patient name and phone are required');
                          return;
                        }
                        const success = await handleCreatePatient({
                          name: formData.patientName,
                          phone: formData.phone,
                          gender: formData.gender,
                          dob: formData.dob,
                          googleDocLink: formData.googleDocLink || ''
                        });
                        if (success) {
                          setShowNewPatientFields(false);
                          setCreatingNewPatient(false);
                        }
                      }}
                    >
                      <Save size={16} /> Create Patient & Continue
                    </button>
                  </div>
                )}

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

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Appointment'}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Patient Edit Modal */}
        {showEditModal && modalType === 'patient' && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><User size={20} /> {editingPatientId === 'new' ? 'Add New Patient' : 'Edit Patient'}</h3>
                <button className="btn-icon" onClick={() => setShowEditModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={editingPatientData?.name || ''}
                    onChange={(e) => setEditingPatientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Patient full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={editingPatientData?.phone || ''}
                    onChange={(e) => setEditingPatientData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={displayToIsoDate(editingPatientData?.dob || '')}
                    onChange={(e) => setEditingPatientData(prev => ({ ...prev, dob: isoToDisplayDate(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label>Google Doc Link</label>
                  <input
                    type="url"
                    value={editingPatientData?.googleDocLink || ''}
                    onChange={(e) => setEditingPatientData(prev => ({ ...prev, googleDocLink: e.target.value }))}
                    placeholder="https://docs.google.com/..."
                  />
                </div>
                
                {editingPatientId && editingPatientId !== 'new' && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                    <h4>Appointment History</h4>
                    {(() => {
                      const patientApts = appointments.filter(a => 
                        a.phone === editingPatientData?.phone || 
                        a.patientName.toLowerCase() === editingPatientData?.name?.toLowerCase()
                      ).sort((a, b) => {
                        const dateCompare = b.date.localeCompare(a.date);
                        if (dateCompare !== 0) return dateCompare;
                        return formatTimeDisplay(b.time).localeCompare(formatTimeDisplay(a.time));
                      });
                      
                      if (patientApts.length === 0) {
                        return <p className="text-muted">No appointments found</p>;
                      }
                      
                      return (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table className="appointments-table" style={{ fontSize: '0.9em' }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Doctor</th>
                                <th>Status</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patientApts.map(apt => (
                                <tr key={apt.id}>
                                  <td>{apt.displayDate}</td>
                                  <td>{formatTimeDisplay(apt.time)}</td>
                                  <td>{apt.doctor || '-'}</td>
                                  <td><span className={`badge badge-${apt.status.toLowerCase()}`}>{apt.status}</span></td>
                                  <td>{apt.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setShowEditModal(false);
                  setEditingPatientId(null);
                  setEditingPatientData(null);
                }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={async () => {
                  if (!editingPatientData?.name || !editingPatientData?.phone) {
                    setError('Name and phone are required');
                    return;
                  }
                  
                  let success = false;
                  if (editingPatientId === 'new') {
                    success = await handleCreatePatient(editingPatientData);
                  } else {
                    await handleUpdatePatient(editingPatientId, editingPatientData);
                    success = true;
                  }
                  
                  if (success) {
                    setShowEditModal(false);
                    setEditingPatientId(null);
                    setEditingPatientData(null);
                    await fetchAllData();
                  }
                }}>
                  <Save size={16} /> {editingPatientId === 'new' ? 'Create Patient' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
