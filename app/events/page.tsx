'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Ticket, Calendar, MapPin, Clock, ArrowLeft, Upload, CheckCircle2, Loader2, Sparkles, AlertCircle, Search, XCircle } from 'lucide-react';

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
}

interface TicketStatusResult {
  id: string;
  full_name: string;
  matric_no: string;
  status: 'pending' | 'approved' | 'rejected';
  events: {
    title: string;
  } | null;
}

function formatDisplayTime(timeStr: string) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

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
    return { text: `${days}d ${hours}h left`, isExpired: false, isNear: days <= 1 };
  } else if (hours > 0) {
    return { text: `${hours}h ${minutes}m left`, isExpired: false, isNear: true };
  } else {
    return { text: `${minutes}m left`, isExpired: false, isNear: true };
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Registration Modal Form State
  const [fullName, setFullName] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [whatsappNo, setWhatsappNo] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Status Search Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchMatric, setSearchMatric] = useState('');
  const [searchingStatus, setSearchingStatus] = useState(false);
  const [statusResults, setStatusResults] = useState<TicketStatusResult[] | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!searchMatric.trim()) return;

    setSearchingStatus(true);
    setStatusResults(null);

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          full_name,
          matric_no,
          status,
          events ( title )
        `)
        .ilike('matric_no', searchMatric.trim());

      if (error) throw error;
      setStatusResults((data as unknown as TicketStatusResult[]) || []);
    } catch (err) {
      console.error('Error checking status:', err);
      alert('Failed to search status.');
    } finally {
      setSearchingStatus(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || !receiptFile) return;

    setSubmitting(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('registrations').insert([
        {
          event_id: selectedEvent.id,
          full_name: fullName,
          matric_no: matricNo,
          whatsapp_no: whatsappNo,
          receipt_url: publicUrlData.publicUrl,
          status: 'pending',
        },
      ]);

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to submit receipt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowStatusModal(true);
                setStatusResults(null);
                setSearchMatric('');
              }}
              className="flex items-center gap-1.5 bg-slate-900 border border-purple-800/60 hover:bg-purple-950/60 px-4 py-2 rounded-full text-xs font-semibold text-purple-300 transition-all shadow-md"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              Check Ticket Status
            </button>
            <div className="flex items-center gap-2 bg-purple-900/40 border border-purple-500/30 px-4 py-2 rounded-full text-xs font-semibold text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Active UNIZIK Events
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Upcoming Campus Parties
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mb-12">
          Select an event, make your bank transfer, and upload your payment proof before tickets expire.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-500" />
            <p>Loading party schedule...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">No Active Events Yet</h3>
            <p className="text-slate-500 text-xs">Executives have not published any party tickets right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((evt) => {
              const remaining = getTimeRemaining(evt.date, evt.time);

              return (
                <div key={evt.id} className="bg-slate-900/80 border border-purple-900/50 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl">
                  {evt.flyer_url && (
                    <div className="h-48 w-full overflow-hidden bg-slate-950">
                      <img src={evt.flyer_url} alt={evt.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold px-3 py-1 bg-purple-950 border border-purple-500/30 text-purple-300 rounded-full">
                          ₦{evt.ticket_price.toLocaleString()}
                        </span>

                        <div
                          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
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

                      <h3 className="text-xl font-bold mb-2 text-white">{evt.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-6">{evt.description}</p>

                      <div className="space-y-2 text-xs text-slate-300 mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>{evt.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-pink-400" />
                          <span>{formatDisplayTime(evt.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <span>{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={remaining.isExpired}
                      onClick={() => { setSelectedEvent(evt); setSuccess(false); }}
                      className={`w-full font-bold py-3 rounded-2xl shadow-lg transition-all ${
                        remaining.isExpired
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                      }`}
                    >
                      {remaining.isExpired ? 'Tickets Closed' : 'Get Ticket'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHECK STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-800/60 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Check Ticket Status</h2>
            <p className="text-slate-400 text-xs mb-6">Enter your Matric / Reg Number to verify your payment status.</p>

            <form onSubmit={handleCheckStatus} className="space-y-4 text-xs mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={searchMatric}
                  onChange={(e) => setSearchMatric(e.target.value)}
                  placeholder="e.g. 2022/123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={searchingStatus}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {searchingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Search
                </button>
              </div>
            </form>

            {statusResults !== null && (
              <div className="space-y-3 border-t border-slate-800 pt-4 max-h-60 overflow-y-auto">
                {statusResults.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-4">
                    No registrations found for matric number "{searchMatric}".
                  </p>
                ) : (
                  statusResults.map((res) => (
                    <div key={res.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-white block">{res.events?.title || 'Campus Event'}</strong>
                          <span className="text-slate-400">{res.full_name}</span>
                        </div>
                        {res.status === 'pending' && (
                          <span className="bg-amber-950/80 border border-amber-700 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Under Review
                          </span>
                        )}
                        {res.status === 'approved' && (
                          <span className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved & Sent
                          </span>
                        )}
                        {res.status === 'rejected' && (
                          <span className="bg-rose-950/80 border border-rose-700 text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>

                      {res.status === 'rejected' && (
                        <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
                          ⚠️ Your payment receipt was declined. Please double-check your bank transfer proof and submit a new ticket request or contact executive support.
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TICKET PURCHASE MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-800/60 rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            {success ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-bold text-white mb-2">Proof Submitted!</h2>
                <p className="text-slate-300 text-sm mb-6">
                  Your payment receipt for <span className="text-purple-300 font-semibold">{selectedEvent.title}</span> has been uploaded. An admin will verify and contact your WhatsApp shortly.
                </p>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">Buy Ticket: {selectedEvent.title}</h2>
                <p className="text-slate-400 text-xs mb-6">Complete bank transfer and submit proof below.</p>

                <div className="bg-purple-950/40 border border-purple-800/50 p-4 rounded-2xl mb-6 text-xs space-y-1">
                  <div className="text-purple-300 font-semibold mb-1">Bank Transfer Details:</div>
                  <div className="flex justify-between text-slate-300"><span>Bank:</span> <strong className="text-white">{selectedEvent.bank_name}</strong></div>
                  <div className="flex justify-between text-slate-300"><span>Account No:</span> <strong className="text-amber-300 font-mono text-sm">{selectedEvent.account_number}</strong></div>
                  <div className="flex justify-between text-slate-300"><span>Account Name:</span> <strong className="text-white">{selectedEvent.account_name}</strong></div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-purple-800/40 mt-1"><span>Amount:</span> <strong className="text-emerald-400 font-bold">₦{selectedEvent.ticket_price.toLocaleString()}</strong></div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Matric / Reg No</label>
                      <input
                        type="text"
                        required
                        value={matricNo}
                        onChange={(e) => setMatricNo(e.target.value)}
                        placeholder="2022/123456"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">WhatsApp Phone No</label>
                      <input
                        type="tel"
                        required
                        value={whatsappNo}
                        onChange={(e) => setWhatsappNo(e.target.value)}
                        placeholder="08012345678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Upload Payment Receipt</label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-900/60 file:text-purple-300 hover:file:bg-purple-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{submitting ? 'Submitting Receipt...' : 'Submit Payment Proof'}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}