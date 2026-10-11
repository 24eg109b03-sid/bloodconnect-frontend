import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  ArrowRight,
  Check,
  ClipboardList,
  Droplet,
  HeartHandshake,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X
} from 'lucide-react';
import './styles.css';

const TOKEN_KEY = 'bloodconnectToken';
const USER_KEY = 'bloodconnectUser';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ROLES = [
  { value: 'DONOR', label: 'Donor' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'HOSPITAL', label: 'Hospital' }
];

function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

const API_BASE_URL = 'https://bloodconnect-backend-production-aca1.up.railway.app';

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) clearSession();
  }
  if (response.status === 204) return null;

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Request failed (${response.status}).`);
  return result;
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    setFields(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    if (mode === 'register' && fields.password !== fields.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setBusy(true);
    const registering = mode === 'register';
    const payload = registering
      ? {
          name: fields.name?.trim(),
          email: fields.email?.trim(),
          password: fields.password,
          phone: fields.phone?.trim(),
          bloodGroup: fields.bloodGroup,
          location: fields.location?.trim(),
          role: fields.role
        }
      : { email: fields.email?.trim(), password: fields.password };

    try {
      const result = await api(registering ? '/users/register' : '/users/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (registering) {
        setFields(current => ({ email: current.email, password: '', confirmPassword: '' }));
        setMode('login');
        setMessage({ type: 'success', text: 'Account created. Sign in to continue.' });
      } else {
        if (typeof result.token !== 'string' || !result.token || !result.user) {
          throw new Error('Sign-in response did not include an authentication token.');
        }
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        localStorage.setItem(TOKEN_KEY, result.token);
        window.location.href = '/?view=dashboard';
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside" aria-label="BloodConnect">
        <div className="aside-top"><span className="brand-mark"><Droplet size={20} fill="currentColor" /></span><span>BloodConnect</span></div>
        <div className="aside-message">
          <p className="eyebrow">A stronger link between need and care</p>
          <h1>Every donation brings someone closer to tomorrow.</h1>
          <p>Find local requests, coordinate support, and keep essential connections moving.</p>
        </div>
        <div className="aside-foot"><Activity size={17} /> Community-powered blood support</div>
      </section>

      <section className="auth-main">
        <div className="auth-form-wrap">
          <p className="mobile-brand"><Droplet size={18} fill="currentColor" /> BloodConnect</p>
          <div className="auth-heading">
            <p className="eyebrow">{mode === 'login' ? 'Your community is here' : 'Join the network'}</p>
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue to your account.' : 'Add your details to connect with local blood support.'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setMessage(null); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'selected' : ''} onClick={() => { setMode('register'); setMessage(null); }}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && <>
              <label>Full name<input name="name" autoComplete="name" value={fields.name || ''} onChange={updateField} required /></label>
              <div className="form-grid">
                <label>Email<input name="email" type="email" autoComplete="email" value={fields.email || ''} onChange={updateField} required /></label>
                <label>Phone number<input name="phone" type="tel" autoComplete="tel" value={fields.phone || ''} onChange={updateField} required /></label>
                <label>Password<input name="password" type="password" autoComplete="new-password" minLength="8" value={fields.password || ''} onChange={updateField} required /></label>
                <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" value={fields.confirmPassword || ''} onChange={updateField} required /></label>
                <label>Blood group<select name="bloodGroup" value={fields.bloodGroup || ''} onChange={updateField} required><option value="">Select group</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></label>
                <label>Role<select name="role" value={fields.role || ''} onChange={updateField} required><option value="">Select role</option>{ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
              </div>
              <label>Location<input name="location" autoComplete="address-level2" value={fields.location || ''} onChange={updateField} required /></label>
            </>}
            {mode === 'login' && <>
              <label>Email<input name="email" type="email" autoComplete="email" value={fields.email || ''} onChange={updateField} required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" value={fields.password || ''} onChange={updateField} required /></label>
            </>}
            {message && <p className={`notice ${message.type}`} role="status">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-privacy"><ShieldCheck size={15} /> Your account details are handled by BloodConnect.</p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return <label className="field-label">{label}{children}</label>;
}

function Notice({ notice }) {
  if (!notice) return null;
  return <p className={`notice ${notice.type}`} role="status">{notice.text}</p>;
}

function Dashboard() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [notice, setNotice] = useState(null);
  const [adminNotice, setAdminNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        clearSession();
        window.location.replace('/');
        return;
      }
      try {
        const currentUser = await api('/users/me');
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        setUser(currentUser);
        const [openRequests, donations, users] = await Promise.all([
          api('/requests'),
          currentUser.role === 'DONOR'
            ? api(`/donations?donorEmail=${encodeURIComponent(currentUser.email)}`)
            : Promise.resolve([]),
          currentUser.role === 'ADMIN' ? api('/users') : Promise.resolve([])
        ]);
        if (!active) return;
        setRequests(openRequests);
        setHistory(donations);
        setAdminUsers(users);
      } catch (error) {
        if (!active) return;
        setNotice({ type: 'error', text: error.message });
        if (!localStorage.getItem(TOKEN_KEY)) window.location.replace('/');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboard();
    return () => { active = false; };
  }, []);

  const role = (user?.role || '').toUpperCase();

  async function refreshRequests() {
    setRequests(await api('/requests'));
  }

  async function createRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setNotice(null);
    try {
      await api('/requests', {
        method: 'POST',
        body: JSON.stringify({
          requesterEmail: user.email,
          bloodGroup: data.get('bloodGroup'),
          quantity: Number(data.get('quantity')),
          urgency: data.get('urgency'),
          location: data.get('location').trim()
        })
      });
      form.reset();
      setNotice({ type: 'success', text: 'Blood request submitted.' });
      await refreshRequests();
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  }

  async function searchRequests(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const result = await api(`/requests/search?bloodGroup=${encodeURIComponent(data.get('bloodGroup'))}&location=${encodeURIComponent(data.get('location').trim())}`);
      setSearchResults(result);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    }
  }

  async function respondToRequest(request) {
    setBusyId(request.id);
    setNotice(null);
    try {
      const accepted = await api(`/requests/${request.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACCEPTED' })
      });
      await api('/donations', {
        method: 'POST',
        body: JSON.stringify({
          donorEmail: user.email,
          bloodGroup: accepted.bloodGroup,
          hospital: accepted.location,
          quantity: accepted.quantity,
          status: 'COMPLETED'
        })
      });
      await refreshRequests();
      setHistory(await api(`/donations?donorEmail=${encodeURIComponent(user.email)}`));
      setNotice({ type: 'success', text: 'You responded to the blood request.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusyId(null);
    }
  }

  async function updateAdminUser(updatedUser) {
    setAdminNotice(null);
    try {
      const saved = await api(`/users/${updatedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          bloodGroup: updatedUser.bloodGroup,
          location: updatedUser.location,
          role: updatedUser.role
        })
      });
      setAdminUsers(current => current.map(item => item.id === saved.id ? saved : item));
      setAdminNotice({ type: 'success', text: 'User changes saved.' });
    } catch (error) {
      setAdminNotice({ type: 'error', text: error.message });
    }
  }

  async function deleteAdminUser(id) {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    setAdminNotice(null);
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      setAdminUsers(current => current.filter(item => item.id !== id));
      setAdminNotice({ type: 'success', text: 'User deleted.' });
    } catch (error) {
      setAdminNotice({ type: 'error', text: error.message });
    }
  }

  function signOut() {
    clearSession();
    window.location.replace('/');
  }

  if (loading) return <main className="loading-state"><span className="spinner" />Loading your dashboard…</main>;
  if (!user) return <main className="loading-state"><Notice notice={notice} /></main>;

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <a className="topbar-brand" href="/"><span className="brand-mark"><Droplet size={18} fill="currentColor" /></span>BloodConnect</a>
        <div className="topbar-right"><span className="role-chip">{role === 'ADMIN' && <ShieldCheck size={14} />}{role}</span><button className="quiet-button" type="button" onClick={signOut}><LogOut size={16} />Sign out</button></div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-row">
          <div><p className="eyebrow">{role} workspace</p><h1>Good to see you, {user.name || 'there'}.</h1><p>{role === 'DONOR' ? 'Your time and generosity can make a real difference.' : 'Coordinate blood support and keep your details up to date.'}</p></div>
          <div className="welcome-symbol"><HeartHandshake size={30} /></div>
        </section>

        <Notice notice={notice} />

        <div className="dashboard-grid">
          <section className="panel profile-panel">
            <div className="section-heading"><div><p className="eyebrow">Account</p><h2>Your profile</h2></div><Users size={19} /></div>
            <dl className="profile-list">
              {[['Email', user.email], ['Phone', user.phone], ['Blood group', user.bloodGroup], ['Location', user.location]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}
            </dl>
          </section>

          {role !== 'DONOR' && <section className="panel">
            <div className="section-heading"><div><p className="eyebrow">Need support</p><h2>Create blood request</h2></div><Droplet size={19} /></div>
            <form className="stack-form" onSubmit={createRequest}>
              <Field label="Blood group"><select name="bloodGroup" required defaultValue=""><option value="">Select group</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></Field>
              <div className="form-grid">
                <Field label="Quantity (units)"><input name="quantity" type="number" min="1" required /></Field>
                <Field label="Urgency"><select name="urgency" defaultValue="Normal"><option>Normal</option><option>Urgent</option><option>Emergency</option></select></Field>
              </div>
              <Field label="Location"><input name="location" required /></Field>
              <button className="primary-button" type="submit"><Droplet size={16} />Submit request</button>
            </form>
          </section>}

          {role === 'DONOR' && <section className="panel">
            <div className="section-heading"><div><p className="eyebrow">Find a match</p><h2>Search requests</h2></div><Search size={19} /></div>
            <form className="stack-form" onSubmit={searchRequests}>
              <Field label="Blood group"><select name="bloodGroup" required defaultValue=""><option value="">Select group</option>{BLOOD_GROUPS.map(group => <option key={group}>{group}</option>)}</select></Field>
              <Field label="Location"><input name="location" placeholder="City or area" required /></Field>
              <button className="primary-button" type="submit"><Search size={16} />Search requests</button>
            </form>
            {searchResults && <RequestList requests={searchResults} role={role} onRespond={respondToRequest} busyId={busyId} />}
          </section>}

          <section className="panel requests-panel">
            <div className="section-heading"><div><p className="eyebrow">Community</p><h2>Open requests</h2></div><ClipboardList size={19} /></div>
            <RequestList requests={requests} role={role} onRespond={respondToRequest} busyId={busyId} />
          </section>

          {role === 'DONOR' && <section className="panel">
            <div className="section-heading"><div><p className="eyebrow">Your activity</p><h2>Donation history</h2></div><Activity size={19} /></div>
            {history.length ? <div className="item-list">{history.map(item => <article className="list-item" key={item.id}><strong>{item.bloodGroup} <span>·</span> {item.quantity} unit(s)</strong><small><MapPin size={13} />{item.hospital || 'Location not listed'} · {item.donationDate} · {item.status}</small></article>)}</div> : <p className="empty-state">No donations recorded yet.</p>}
          </section>}

          {role === 'ADMIN' && <section className="panel admin-panel">
            <div className="section-heading"><div><p className="eyebrow">Administration</p><h2>Manage users</h2></div><ShieldCheck size={19} /></div>
            <Notice notice={adminNotice} />
            {adminUsers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood group</th><th>Location</th><th>Role</th><th>Actions</th></tr></thead><tbody>
              {adminUsers.map(account => <AdminUserRow key={account.id} account={account} onSave={updateAdminUser} onDelete={deleteAdminUser} />)}
            </tbody></table></div> : <p className="empty-state">No users found.</p>}
          </section>}
        </div>
      </main>
    </div>
  );
}

function RequestList({ requests, role, onRespond, busyId }) {
  if (!requests?.length) return <p className="empty-state">No open requests found.</p>;
  return <div className="item-list">{requests.map(request => <article className="list-item request-item" key={request.id}>
    <div className="request-copy"><strong>{request.bloodGroup} <span>·</span> {request.quantity} unit(s)</strong><small><MapPin size={13} />{request.location} · {request.urgency} · {request.status}</small><small>{request.requesterEmail}</small></div>
    {role === 'DONOR' && <button className="outline-button" type="button" disabled={busyId === request.id} onClick={() => onRespond(request)}>{busyId === request.id ? 'Sending…' : <><HeartHandshake size={15} />Respond</>}</button>}
  </article>)}</div>;
}

function AdminUserRow({ account, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...account });
  const locked = account.role === 'ADMIN';
  function update(event) {
    setDraft(current => ({ ...current, [event.target.name]: event.target.value }));
  }
  return <tr>
    <td><input name="name" aria-label="Name" value={draft.name || ''} disabled={locked} onChange={update} /></td>
    <td><input name="email" aria-label="Email" type="email" value={draft.email || ''} disabled={locked} onChange={update} /></td>
    <td><input name="phone" aria-label="Phone" value={draft.phone || ''} disabled={locked} onChange={update} /></td>
    <td><input name="bloodGroup" aria-label="Blood group" value={draft.bloodGroup || ''} disabled={locked} onChange={update} /></td>
    <td><input name="location" aria-label="Location" value={draft.location || ''} disabled={locked} onChange={update} /></td>
    <td>{locked ? 'ADMIN' : <select name="role" aria-label="Role" value={draft.role} onChange={update}>{ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select>}</td>
    <td className="admin-actions">{locked ? <span className="locked-label"><ShieldCheck size={14} />Configured admin</span> : <><button className="icon-button" type="button" title="Save user" aria-label="Save user" onClick={() => onSave(draft)}><Check size={16} /></button><button className="icon-button danger" type="button" title="Delete user" aria-label="Delete user" onClick={() => onDelete(account.id)}><Trash2 size={16} /></button></>}</td>
  </tr>;
}

function App() {
  const hasSession = Boolean(localStorage.getItem(TOKEN_KEY));
  const isDashboard = new URLSearchParams(window.location.search).get('view') === 'dashboard';
  return isDashboard && hasSession ? <Dashboard /> : <AuthScreen />;
}

createRoot(document.getElementById('root')).render(<App />);
