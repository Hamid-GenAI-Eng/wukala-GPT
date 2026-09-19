import React from 'react';
import { Scale, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, CalendarDays, Printer, FolderOpen } from 'lucide-react';
import { Hearing } from './HearingCalendar';

interface PrintableWeekCalendarProps {
  hearings: Hearing[];
  weekDays: Date[];
}

export const PrintableWeekCalendar: React.FC<PrintableWeekCalendarProps> = ({ hearings, weekDays }) => {
  const lawyerName = "Adv. Abdullah Nasir";
  const lawyerTitle = "Advocate High Court";
  const lawyerLocation = "Lahore, Pakistan";

  const sortedHearings = [...hearings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalHearings = sortedHearings.length;
  // Let's assume upcoming is Scheduled/Hearing, completed is passed, etc. For visual match, we'll just mock the counts based on actual data if possible, or calculate:
  const upcoming = sortedHearings.filter(h => h.status !== 'Completed' && h.status !== 'Adjourned').length;
  const completed = sortedHearings.filter(h => h.status === 'Completed').length;
  const adjourned = sortedHearings.filter(h => h.status === 'Adjourned').length;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const shortFormatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </span>
        );
      case 'adjourned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" /> Adjourned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="h-3.5 w-3.5" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div id="printable-week-calendar" className="bg-white text-slate-900 p-10 w-[1123px] font-sans" style={{ minHeight: '794px', display: 'none' }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2" style={{ color: '#0f172a' }}>Weekly Hearing Schedule</h1>
          <p className="text-xl text-slate-500 mb-2">Court & Hearing Module</p>
          <p className="text-slate-400 font-medium">
            {formatDate(weekDays[0])} &ndash; {formatDate(weekDays[6])}
          </p>
        </div>

        <div className="flex gap-8">
          <div className="text-right border-r-2 border-slate-200 pr-8 py-1">
            <h2 className="text-lg font-bold text-slate-800" style={{ color: '#1e293b' }}>{lawyerName}</h2>
            <p className="text-slate-500">{lawyerTitle}</p>
            <p className="text-slate-400 text-sm">{lawyerLocation}</p>
          </div>
          
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Printed on</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(new Date())}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Week of</p>
                <p className="text-sm font-semibold text-slate-700">{shortFormatDate(weekDays[0])} &ndash; {shortFormatDate(weekDays[6])}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Cases</p>
                <p className="text-sm font-semibold text-slate-700">{totalHearings} Hearings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{totalHearings}</p>
            <p className="text-sm text-slate-500 font-medium">Total Hearings</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{upcoming}</p>
            <p className="text-sm text-slate-500 font-medium">Upcoming This Week</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{completed}</p>
            <p className="text-sm text-slate-500 font-medium">Completed</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{adjourned}</p>
            <p className="text-sm text-slate-500 font-medium">Adjourned</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 overflow-hidden mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200">
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm w-12 text-center">#</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Date</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Day</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Time</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Case Ref.</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Case Title / Client</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Court</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Judge / Bench</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Hearing Type</th>
              <th className="py-4 px-4 font-semibold text-slate-600 text-sm">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedHearings.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500 italic">No hearings scheduled for this week.</td>
              </tr>
            ) : (
              sortedHearings.map((h, index) => {
                const hDate = new Date(h.date);
                const timeStr = hDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const dateStr = shortFormatDate(hDate);
                const dayStr = hDate.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <tr key={h.id || index} className="hover:bg-slate-50/50">
                    <td className="py-5 px-4 text-sm text-slate-500 text-center">{index + 1}</td>
                    <td className="py-5 px-4 text-sm text-slate-600">{dateStr}</td>
                    <td className="py-5 px-4 text-sm text-slate-600 font-medium">{dayStr}</td>
                    <td className="py-5 px-4 text-sm text-slate-600">{timeStr}</td>
                    <td className="py-5 px-4 text-sm font-semibold text-slate-800">{h.caseNumber || `WK-100${index+1}`}</td>
                    <td className="py-5 px-4">
                      <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{h.title}</p>
                      <p className="text-xs text-slate-500">{h.client || 'Client not specified'}</p>
                    </td>
                    <td className="py-5 px-4 text-sm text-slate-600 leading-tight">{h.court}</td>
                    <td className="py-5 px-4 text-sm text-slate-600 leading-tight">{h.judge}</td>
                    <td className="py-5 px-4 text-sm text-slate-600">{h.type || 'Hearing'}</td>
                    <td className="py-5 px-4">
                      {getStatusBadge(h.status || 'Scheduled')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Section */}
      <div className="flex justify-between items-end border-t border-slate-200 pt-8 mt-auto pb-4">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-blue-900" style={{ color: '#1e3a8a' }} />
          <p className="text-slate-600 font-serif italic tracking-wide">Committed to Justice. Focused on Results.</p>
        </div>
        <div className="text-right flex items-center gap-4">
          <div className="w-16 border-t border-slate-300"></div>
          <div>
            <p className="text-sm text-slate-600">Generated by <span className="font-bold text-slate-900">Wukala-GPT</span></p>
            <p className="text-xs text-slate-400 mt-0.5">AI for Lawyers. Built for Pakistan.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
