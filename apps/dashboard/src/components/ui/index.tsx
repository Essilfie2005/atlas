import React, { useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

export function Badge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  let bg = 'bg-gray-100';
  let text = 'text-gray-600';
  
  if (['SUCCEEDED', 'DELIVERED', 'ACTIVE', 'MATCHED'].includes(normalized)) {
    bg = 'bg-[#00D924]/10';
    text = 'text-[#00D924]';
  } else if (['FAILED', 'REVOKED', 'MISMATCHED'].includes(normalized)) {
    bg = 'bg-[#FF4D4D]/10';
    text = 'text-[#FF4D4D]';
  } else if (['PENDING', 'PROCESSING', 'CREATED'].includes(normalized)) {
    bg = 'bg-[#F59E0B]/10';
    text = 'text-[#F59E0B]';
  } else if (['EXCEPTION'].includes(normalized)) {
    bg = 'bg-brand/10';
    text = 'text-brand';
  }

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", bg, text)}>
      {status}
    </span>
  );
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, ...props }: any) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark focus:ring-brand",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-brand",
    danger: "bg-[#FF4D4D] text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], loading && "opacity-75 cursor-not-allowed", className)} disabled={loading} {...props}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

export function Card({ children, className }: any) {
  return (
    <div className={cn("bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-[#E6EBF1]", className)}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, change, isCurrency = false }: any) {
  const isPositive = change >= 0;
  return (
    <Card className="p-5 flex flex-col justify-between">
      <h3 className="text-sm font-medium text-[#697386] mb-2">{label}</h3>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-semibold text-[#1A1F36]">
          {isCurrency ? formatCurrency(value) : value}
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center text-sm font-medium", isPositive ? "text-[#00D924]" : "text-[#FF4D4D]")}>
            {isPositive ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

export function Table({ columns, data, onRowClick, loading, empty }: any) {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-[#E6EBF1] overflow-hidden">
        <div className="p-4 border-b border-[#E6EBF1]"><Skeleton className="h-6 w-1/4" /></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-[#E6EBF1]"><Skeleton className="h-6 w-full" /></div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-[#E6EBF1] p-12 text-center">
        {empty}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.08)] border border-[#E6EBF1] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-[#F6F9FC] text-[#697386] font-medium border-b border-[#E6EBF1]">
            <tr>
              {columns.map((col: any, i: number) => (
                <th key={i} className="px-6 py-3 whitespace-nowrap">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EBF1]">
            {data.map((row: any, i: number) => (
              <tr 
                key={i} 
                onClick={() => onRowClick && onRowClick(row)}
                className={cn("bg-white transition-colors duration-150", onRowClick && "cursor-pointer hover:bg-[#F0F5FA]")}
              >
                {columns.map((col: any, j: number) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap">
                    {col.accessor ? row[col.accessor] : col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onPageChange }: any) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#E6EBF1] sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button variant="secondary" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</Button>
        <Button variant="secondary" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Next</Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              &larr; Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              Next &rarr;
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: any) {
  return (
    <div className="text-center p-8 flex flex-col items-center">
      <div className="mb-4 text-gray-400">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors" title="Copy">
      {copied ? (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );
}
