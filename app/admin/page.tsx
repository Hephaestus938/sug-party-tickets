'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import {
  ShieldCheck,
  Lock,
  PlusCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Loader2,
  Sparkles,
  RefreshCw,
  CalendarDays,
  Clock,
  MapPin,
  Trash2,
  AlertCircle,
  Ticket,
  LogOut,
  Megaphone
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  ticket_price: number;
  account_number: string;
  bank_name: string;
  account_name: string;
  flyer_url: string;
  created_at: string;
}

interface Registration {
  id: string;
  full_name: string;
  matric_no: string;
  whatsapp_no: string;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  events: {
    title: string;
    ticket_price: number;
  } | null;
}

interface SponsorItem {
  id: string;
  name: string;
  banner_url: string;
  link_url: string | null;
  category: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// 30-minute time intervals for dropdown selection
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const min = i % 2 === 0 ? '00' : '30';
  const hh = String(hour).padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return {
    value: `${hh}:${min}`,
    label: `${displayHour}:${min} ${period}`,
  };
});

export default function AdminPage() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Dashboard Tabs & Data State
  const [activeTab, setActiveTab] = useState<'registrations' | 'manage-events' | 'create-event' | 'sponsors'>('registrations');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const [postedEvents, setPostedEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [price, setPrice] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);

  // Sponsor / Ad Placement State
  const [postedSponsors, setPostedSponsors] = useState<SponsorItem[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLink, setSponsorLink] = useState('');
  const [sponsorCategory, setSponsorCategory] = useState('Campus Business');
  const [sponsorDurationDays, setSponsorDurationDays] = useState<number>(7); // Default 7 days
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [uploadingSponsor, setUploadingSponsor] = useState(false);

  // Check and listen for active Supabase Auth sessions
  useEffect(() => {
    async function checkCurrentSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setCheckingSession(false);

      if (session?.user) {
        fetchRegistrations();
        fetchPostedEvents();
        fetchPostedSponsors();
      }
    }

    checkCurrentSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchRegistrations();
        fetchPostedEvents();
        fetchPostedSponsors();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // HANDLERS & API FUNCTIONS
  // ==========================================

  // 1. Executive Auth Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      setEmail('');
      setPassword('');
    } catch (err: any) {
      alert(`Login Failed: ${err.message || 'Invalid credentials'}`);
    } finally {
      setLoggingIn(false);
    }
  }

  // 2. Executive Sign Out
  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  // 3. Fetch receipts
  async function fetchRegistrations() {
    setLoadingRegistrations(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          events (
            title,
            ticket_price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  }

  // 4. Fetch events
  async function fetchPostedEvents() {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostedEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }

  // 5. Fetch sponsors/ads
  async function fetchPostedSponsors() {
    setLoadingSponsors(true);
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPostedSponsors(data || []);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
    } finally {
      setLoadingSponsors(false);
    }
  }

  // 6. Update Registration Verification Status
  async function updateStatus(id: string, newStatus: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status: newStatus } : reg))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update status.');
    }
  }

  // 7. Delete Event
  async function handleDeleteEvent(id: string, eventTitle: string) {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;

      setPostedEvents((prev) => prev.filter((e) => e.id !== id));
      alert('Event deleted successfully.');
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Error deleting event.');
    }
  }

  // 8. Delete Sponsor/Ad
  async function handleDeleteSponsor(id: string, sponsorName: string) {
    if (!confirm(`Are you sure you want to delete the ad for "${sponsorName}"?`)) return;

    try {
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) throw error;

      setPostedSponsors((prev) => prev.filter((s) => s.id !== id));
      alert('Sponsor ad deleted successfully.');
    } catch (err) {
      console.error('Failed to delete sponsor ad:', err);
      alert('Error deleting sponsor ad.');
    }
  }

  // 9. Create Event
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreatingEvent(true);
    setEventSuccess(false);

    try {
      let flyerUrl = '';

      if (flyerFile) {
        const fileExt = flyerFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('flyers').upload(fileName, flyerFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('flyers').getPublicUrl(fileName);
        flyerUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('events').insert([
        {
          title,
          description,
          date,
          time,
          venue,
          ticket_price: parseFloat(price),
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          flyer_url: flyerUrl,
        },
      ]);

      if (insertError) throw insertError;

      setEventSuccess(true);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setVenue('');
      setPrice('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setFlyerFile(null);

      fetchPostedEvents();
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to publish party event.');
    } finally {
      setCreatingEvent(false);
    }
  }

  // 10. Publish Sponsor / Campus Ad
  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!sponsorFile) return alert('Please upload a banner image');

    setUploadingSponsor(true);
    try {
      const fileExt = sponsorFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('sponsors').upload(fileName, sponsorFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('sponsors').getPublicUrl(fileName);

      // Calculate expiration ISO date if duration is specified
      let expiresAtIso: string | null = null;
      if (sponsorDurationDays > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + Number(sponsorDurationDays));
        expiresAtIso = expDate.toISOString();
      }

      const { error: insertError } = await supabase.from('sponsors').insert([
        {
          name: sponsorName,
          link_url: sponsorLink || null,
          category: sponsorCategory,
          banner_url: publicUrlData.publicUrl,
          expires_at: expiresAtIso,
          is_active: true,
        },
      ]);

      if (insertError) throw insertError;

      alert('Sponsor banner published successfully!');
      setSponsorName('');
      setSponsorLink('');
      setSponsorFile(null);
      setSponsorDurationDays(7);

      fetchPostedSponsors();
    } catch (err) {
      console.error('Error publishing sponsor:', err);
      alert('Failed to publish sponsor banner.');
    } finally {
      setUploadingSponsor(false);
    }
  }

  // Countdown / Time remaining helper
  function getTimeRemaining(dateStr: string, timeStr: string) {
    if (!dateStr) return { text: 'Scheduled', isExpired: false, isNear: false };

    let targetDate = new Date(`${dateStr}T${timeStr || '00:00'}`);
    if (isNaN(targetDate.getTime())) targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) return { text: 'Scheduled', isExpired: false, isNear: false };

    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      return { text: 'Event Passed', isExpired: true, isNear: false };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) {
      return { text: `${days}d ${hours}h remaining`, isExpired: false, isNear: days <= 1 };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m remaining`, isExpired: false, isNear: true };
    } else {
      return { text: `${minutes}m remaining`, isExpired: false, isNear: true };
    }
  }

  // Ad Expiration status helper
  function getAdExpiryStatus(expiresAt: string | null) {
    if (!expiresAt) return { text: 'Unlimited', isExpired: false };
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return { text: 'Expired', isExpired: true };
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return { text: `Expires in ${days}d`, isExpired: false };
  }

  const filteredRegistrations = registrations.filter((reg) => {
    if (filterStatus === 'all') return true;
    return reg.status === filterStatus;
  });

  // ==========================================
  // VIEW 1: LOADING SESSION
  // ==========================================
  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-xs text-slate-400">Verifying security session...</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: LOGIN FORM (SUPABASE AUTH)
  // ==========================================
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-purple-800/60 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-16 h-16 bg-purple-950 border border-purple-500/40 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black mb-2">UNIZIK Executive Portal</h1>
          <p className="text-slate-400 text-xs mb-6">Sign in with your executive admin credentials.</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-slate-300 text-xs mb-1 font-medium">Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@unizik.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-xs mb-1 font-medium">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold py-3 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loggingIn ? 'Authenticating...' : 'Sign In To Dashboard'}</span>
            </button>
          </form>

          <div className="mt-6">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
              ← Return to Main Portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: AUTHENTICATED PANEL
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">UNIZIK Control Center</span>
            </div>
            <h1 className="text-3xl font-black">Executive Verification Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Logged in as: <span className="text-purple-300 font-mono">{user.email}</span></p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'registrations'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Verify Receipts
            </button>
            <button
              onClick={() => {
                setActiveTab('manage-events');
                fetchPostedEvents();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manage-events'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Check Events ({postedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('create-event')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'create-event'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Post New Event
            </button>
            <button
              onClick={() => {
                setActiveTab('sponsors');
                fetchPostedSponsors();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sponsors'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              Manage Ads ({postedSponsors.length})
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-950/60 border border-rose-800/40 hover:bg-rose-900 px-3 py-2 rounded-xl text-xs text-rose-300 font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* TAB 1: RECEIPT VERIFICATION */}
        {activeTab === 'registrations' && (
          <div>
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl mb-6">
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                      filterStatus === status
                        ? 'bg-purple-950 border border-purple-500/50 text-purple-300'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchRegistrations}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRegistrations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingRegistrations ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-xs">Fetching payment receipts...</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No {filterStatus !== 'all' ? filterStatus : ''} ticket registrations found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRegistrations.map((reg) => {
                  const eventTitle = reg.events?.title || 'Campus Event';
                  const whatsappMsg = encodeURIComponent(
                    `Hello ${reg.full_name}! Your Party Ticket for ${eventTitle} has been VERIFIED & APPROVED. Show this message at the entrance.`
                  );
                  const whatsappLink = `https://wa.me/${reg.whatsapp_no.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

                  return (
                    <div
                      key={reg.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{reg.full_name}</span>
                          <span className="text-xs text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded-md font-mono">
                            {reg.matric_no}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Event: <span className="text-slate-200 font-medium">{eventTitle}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          WhatsApp: <span className="text-slate-300 font-mono">{reg.whatsapp_no}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <a
                          href={reg.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 bg-slate-950 border border-purple-900/60 hover:border-purple-500 px-3.5 py-2 rounded-xl text-xs text-purple-300 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Receipt
                        </a>

                        {reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(reg.id, 'approved')}
                              className="flex items-center gap-1 bg-emerald-950 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(reg.id, 'rejected')}
                              className="flex items-center gap-1 bg-rose-950 border border-rose-600/50 hover:bg-rose-900 text-rose-300 px-3.5 py-2 rounded-xl text-xs font-bold"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {reg.status === 'approved' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800">
                              Approved
                            </span>
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Send Ticket
                            </a>
                          </div>
                        )}

                        {reg.status === 'rejected' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800">
                              Rejected
                            </span>
                            <a
                              href={`https://wa.me/${reg.whatsapp_no.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello ${reg.full_name}, your ticket payment receipt for ${reg.events?.title || 'Campus Event'} could not be verified. Please check your bank transfer details and submit a valid receipt.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 bg-rose-800 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Notify Student
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHECK / MANAGE EVENTS */}
        {activeTab === 'manage-events' && (
          <div>
            <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl mb-6">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                Active & Published Events ({postedEvents.length})
              </h2>

              <button
                onClick={fetchPostedEvents}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
                Refresh Events
              </button>
            </div>

            {loadingEvents ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                <p className="text-xs">Fetching posted events...</p>
              </div>
            ) : postedEvents.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                No events published yet. Click "Post New Event" to publish your first party!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {postedEvents.map((evt) => {
                  const remaining = getTimeRemaining(evt.date, evt.time);

                  return (
                    <div
                      key={evt.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg relative"
                    >
                      <div>
                        {evt.flyer_url ? (
                          <div className="h-40 w-full overflow-hidden bg-slate-950 relative">
                            <img src={evt.flyer_url} alt={evt.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-20 w-full bg-gradient-to-r from-purple-950 to-slate-900 border-b border-slate-800 p-4 flex items-center">
                            <Ticket className="w-6 h-6 text-purple-400 opacity-50" />
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-bold px-2.5 py-1 bg-purple-950 border border-purple-500/30 text-purple-300 rounded-lg">
                              ₦{evt.ticket_price.toLocaleString()}
                            </span>

                            <div
                              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                remaining.isExpired
                                  ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                                  : remaining.isNear
                                  ? 'bg-amber-950/80 border-amber-700 text-amber-300 animate-pulse'
                                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              }`}
                            >
                              {remaining.isExpired ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              <span>{remaining.text}</span>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-1">{evt.title}</h3>
                          <p className="text-slate-400 text-xs line-clamp-2 mb-4">{evt.description}</p>

                          <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                              <span>{evt.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-pink-400" />
                              <span>{evt.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-amber-400" />
                              <span className="truncate">{evt.venue}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          Posted: {new Date(evt.created_at).toLocaleDateString()}
                        </span>

                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 px-3 py-1.5 rounded-xl transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Event
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREATE EVENT */}
        {activeTab === 'create-event' && (
          <div className="max-w-2xl mx-auto bg-slate-900/90 border border-purple-800/50 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Publish New Party Event</h2>
            <p className="text-slate-400 text-xs mb-6">Fill in party details and bank account info for ticket transfers.</p>

            {eventSuccess && (
              <div className="bg-emerald-950/80 border border-emerald-600 text-emerald-300 p-4 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Party event successfully published to the public portal!
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. UNIZIK Freshman Rave 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details, dress code, special performers..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Time</label>
                  <select
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    <option value="">Select Time</option>
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Ticket Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Venue</label>
                <input
                  type="text"
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. UNIZIK Multipurpose Hall"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="bg-purple-950/30 border border-purple-800/40 p-4 rounded-2xl space-y-3">
                <span className="text-purple-300 font-bold block">Target Bank Account for Student Transfers</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Access Bank"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Account Number</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Account Name</label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="SUG Social Account"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Event Flyer Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFlyerFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/60 file:text-purple-300 hover:file:bg-purple-800"
                />
              </div>

              <button
                type="submit"
                disabled={creatingEvent}
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {creatingEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{creatingEvent ? 'Publishing Event...' : 'Publish Event Live'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: MANAGE ADS & SPONSORS */}
        {activeTab === 'sponsors' && (
          <div className="space-y-8">
            {/* AD CREATION FORM */}
            <div className="max-w-2xl mx-auto bg-slate-900/90 border border-purple-800/50 rounded-3xl p-6 md:p-8 shadow-2xl">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                Publish Campus Ad / Sponsor Banner
              </h2>
              <p className="text-slate-400 text-xs mb-6">Upload partner graphic banners with automated expiration time limits.</p>

              <form onSubmit={handleCreateSponsor} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Business / Partner Name</label>
                    <input
                      type="text"
                      required
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      placeholder="e.g. Ifite Campus Lounge"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Category</label>
                    <select
                      value={sponsorCategory}
                      onChange={(e) => setSponsorCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Campus Business">Campus Business</option>
                      <option value="Food & Drinks">Food & Drinks</option>
                      <option value="Hostel & Rentals">Hostel & Rentals</option>
                      <option value="Shuttle & Logistics">Shuttle & Logistics</option>
                      <option value="Brand Partner">Brand Partner</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Website or WhatsApp Link (Optional)</label>
                    <input
                      type="url"
                      value={sponsorLink}
                      onChange={(e) => setSponsorLink(e.target.value)}
                      placeholder="https://wa.me/2348012345678"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* TIME LIMIT / DURATION DROPDOWN */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Ad Duration / Time Limit</label>
                    <select
                      value={sponsorDurationDays}
                      onChange={(e) => setSponsorDurationDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days (1 Week)</option>
                      <option value={14}>14 Days (2 Weeks)</option>
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={0}>Unlimited (No Expiration)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Banner Image Graphic</label>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setSponsorFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/60 file:text-purple-300 hover:file:bg-purple-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingSponsor}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {uploadingSponsor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  <span>{uploadingSponsor ? 'Uploading Banner...' : 'Publish Sponsor Banner Live'}</span>
                </button>
              </form>
            </div>

            {/* LIST OF ACTIVE / POSTED ADS WITH DELETE BUTTON */}
            <div>
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-2xl mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  Active Posted Ads & Sponsors ({postedSponsors.length})
                </h3>

                <button
                  onClick={fetchPostedSponsors}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSponsors ? 'animate-spin' : ''}`} />
                  Refresh Ads
                </button>
              </div>

              {loadingSponsors ? (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
                  <p className="text-xs">Fetching posted ads...</p>
                </div>
              ) : postedSponsors.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  No ad banners published yet. Use the form above to add your first sponsor!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {postedSponsors.map((sp) => {
                    const expiry = getAdExpiryStatus(sp.expires_at);

                    return (
                      <div
                        key={sp.id}
                        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg relative"
                      >
                        <div>
                          <div className="h-36 w-full overflow-hidden bg-slate-950 relative">
                            <img src={sp.banner_url} alt={sp.name} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30">
                              {sp.category}
                            </div>
                          </div>

                          <div className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-base font-bold text-white">{sp.name}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  expiry.isExpired
                                    ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                                    : sp.expires_at
                                    ? 'bg-purple-950/80 border-purple-800 text-purple-300'
                                    : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                                }`}
                              >
                                {expiry.text}
                              </span>
                            </div>

                            {sp.link_url && (
                              <p className="text-xs text-purple-400 truncate mb-2">
                                Link: <span className="underline">{sp.link_url}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            Posted: {new Date(sp.created_at).toLocaleDateString()}
                          </span>

                          <button
                            onClick={() => handleDeleteSponsor(sp.id, sp.name)}
                            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Ad
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}