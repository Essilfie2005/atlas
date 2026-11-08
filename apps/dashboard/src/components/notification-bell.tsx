'use client';
import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Bell, X, Activity, AlertCircle, RefreshCw, FileText, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: string;
  read?: boolean;
}

function getIcon(action: string) {
  if (action.includes('PAYMENT') || action.includes('TRANSACTION')) return <Activity className="w-4 h-4 text-blue-500" />;
  if (action.includes('DISPUTE')) return <AlertCircle className="w-4 h-4 text-red-500" />;
  if (action.includes('REFUND')) return <RefreshCw className="w-4 h-4 text-amber-500" />;
  if (action.includes('SETTLEMENT') || action.includes('PAYOUT')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/v1/audit-logs?take=20&skip=0');
      const items = (data as any)?.items || [];
      setNotifications(items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-[#0B1F3A] hover:bg-page-bg transition-colors relative"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/60 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center">
                <Bell className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">No activity yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = !readIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
                    className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50 ${isUnread ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUnread ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                      {getIcon(n.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                          {formatAction(n.action)}
                        </p>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{n.resource} · {n.resourceId?.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
            <a href="/dashboard/audit-logs" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
              View all activity →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
