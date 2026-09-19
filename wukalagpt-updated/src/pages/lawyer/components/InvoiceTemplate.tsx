import React from 'react';
import { Phone, Mail, MapPin, Building2, Scale, FileText } from 'lucide-react';

interface InvoiceTemplateProps {
  invoice: any;
  bankDetails: any;
  lawyerDetails?: any;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, bankDetails, lawyerDetails }) => {
  // Ensure amount is parsed
  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
  
  const lawyerName = lawyerDetails?.fullName || lawyerDetails?.name || 'Advocate';
  const lawyerEmail = lawyerDetails?.email || 'email@lawyer.com';
  
  return (
    <div id="invoice-pdf-template" className="bg-white text-slate-900 mx-auto" style={{ width: '210mm', padding: '12mm' }}>
      
      {/* ─── Header Section ─── */}
      <div className="flex justify-between items-start mb-8 gap-6">
        
        {/* Left Side: Graphic & Quote */}
        <div className="flex-1 rounded-2xl overflow-hidden relative bg-slate-50 border border-slate-200 p-6 flex flex-col justify-center min-h-[140px]">
          {/* Subtle Greek Pillar SVG Background */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMaxYMax slice'%3E%3Cpath fill='%23334155' d='M60 0h40v100H60zM40 10h10v80H40zM20 20h10v60H20z'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
            backgroundPosition: 'right'
          }}></div>
          
          <div className="relative z-10">
            <p className="text-xl font-serif text-slate-800 leading-tight italic">
              "Justice begins with trusted counsel."
            </p>
            <div className="h-[1px] w-12 bg-slate-800 mt-4 mb-2"></div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide">
              Your Legal Partner<br/>for a Brighter Tomorrow
            </p>
          </div>
        </div>

        {/* Right Side: Lawyer Details */}
        <div className="w-[320px] shrink-0 text-right">
          <h2 className="text-lg font-bold font-sans text-slate-900">{lawyerName}</h2>
          <p className="text-xs text-slate-600 font-sans mt-0.5">Advocate High Court</p>
          <p className="text-xs text-slate-600 font-sans mb-4">Pakistan</p>

          <div className="flex flex-col items-end gap-1.5 text-[10px] font-sans text-slate-600 mb-4">
            <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" /> +92 300 0000000</div>
            <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" /> {lawyerEmail}</div>
            <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400" /> Pakistan</div>
          </div>

          <div className="text-[9px] font-semibold text-slate-400 tracking-[0.2em] uppercase">
            ADVOCACY &nbsp;|&nbsp; ADVISORY &nbsp;|&nbsp; RESULTS
          </div>
        </div>
      </div>

      {/* ─── Invoice Meta & Bill To ─── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-1">I N V O I C E</div>
          <h1 className="text-4xl font-bold font-sans text-slate-900 mb-6 tracking-tight">{invoice.invoiceNumber || 'INV-XXXX'}</h1>
          
          <div className="grid grid-cols-[110px_1fr] gap-y-2 text-xs font-sans">
            <span className="text-slate-500">Issue Date</span>
            <span className="font-medium text-slate-900">{invoice.dateIssued ? new Date(invoice.dateIssued).toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'}) : 'N/A'}</span>
            
            <span className="text-slate-500">Due Date</span>
            <span className="font-medium text-slate-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'}) : 'N/A'}</span>
            
            <span className="text-slate-500">Case Reference</span>
            <span className="font-medium text-slate-900">{invoice.caseRef || 'N/A'}</span>
            
            <span className="text-slate-500">Payment Terms</span>
            <span className="font-medium text-slate-900">Due on receipt</span>
          </div>
        </div>

        <div className="w-[320px] bg-slate-50 rounded-xl p-5 border border-slate-100 relative">
          {/* Status Badge */}
          <div className={`absolute top-5 right-5 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase
            ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : 
              invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' : 
              'bg-orange-100 text-orange-700'}`}>
            {invoice.status || 'PENDING'}
          </div>

          <p className="text-[10px] font-medium text-slate-500 mb-2 uppercase tracking-wide">Bill To</p>
          <h3 className="text-sm font-bold text-slate-900 mb-1">{invoice.clientName || 'Client Name'}</h3>
          
          <div className="text-xs text-slate-600 space-y-1 mb-3">
            <p>123 Industrial Area,</p>
            <p>Gulberg, Lahore, Pakistan</p>
          </div>

          <div className="text-[10px] text-slate-500 space-y-1">
            <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> +92 321 1234567</div>
            <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> client@company.com</div>
          </div>
        </div>
      </div>

      {/* ─── Line Items Table ─── */}
      <div className="mb-8 rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="py-3 px-4 font-semibold w-10 text-center">#</th>
              <th className="py-3 px-4 font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold text-center w-24">Qty / Hours</th>
              <th className="py-3 px-4 font-semibold text-right w-28">Rate (PKR)</th>
              <th className="py-3 px-4 font-semibold text-right w-32">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items && invoice.items.map((item: any, idx: number) => (
              <tr key={idx} className="bg-white">
                <td className="py-4 px-4 text-center text-slate-500">{idx + 1}</td>
                <td className="py-4 px-4">
                  <p className="font-semibold text-slate-900 mb-0.5">{item.description}</p>
                </td>
                <td className="py-4 px-4 text-center text-slate-700">{item.hours}</td>
                <td className="py-4 px-4 text-right text-slate-700">{item.rate?.toLocaleString()}</td>
                <td className="py-4 px-4 text-right text-slate-900 font-medium">{item.amount?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Notes & Totals ─── */}
      <div className="flex justify-between items-start mb-8 gap-6">
        {/* Notes */}
        <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Notes</h4>
          </div>
          <ol className="text-[10px] text-slate-600 list-decimal list-inside space-y-1.5 leading-relaxed">
            <li>This invoice is issued for professional legal services rendered.</li>
            <li>Payment is due on or before the due date.</li>
            <li>In case of any queries, please contact the undersigned.</li>
            <li>Thank you for your trust.</li>
          </ol>
        </div>

        {/* Totals */}
        <div className="w-[280px] bg-slate-50 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
          <div className="space-y-3 mb-4 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (0%)</span>
              <span>Rs 0</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900">Total Amount</span>
            <span className="text-lg font-bold text-slate-900">Rs {subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ─── Payment Details ─── */}
      <div className="flex gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Payment Details</h4>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-xs font-sans text-slate-600">
            <span>Bank Name</span><span className="font-medium text-slate-900">{bankDetails?.bankName || 'Meezan Bank Limited'}</span>
            <span>Account Title</span><span className="font-medium text-slate-900">{bankDetails?.accountTitle || 'Abdullah Nasir'}</span>
            <span>Account Number</span><span className="font-medium text-slate-900">{bankDetails?.accountNumber || 'PK36MEZN0001234567890123'}</span>
            <span>IBAN</span><span className="font-medium text-slate-900">{bankDetails?.iban || 'PK36MEZN0001234567890123'}</span>
            <span>Branch</span><span className="font-medium text-slate-900">{bankDetails?.branch || 'Gulberg III, Lahore'}</span>
          </div>
        </div>
        
        <div className="w-[280px] flex items-center justify-center p-5 border-l border-slate-200">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <h5 className="text-xs font-bold text-slate-900 mb-1">Secure & Direct Payment</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Transfer via Bank, JazzCash, Easypaisa or other secure channels.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex items-end justify-between">
        <div className="flex items-center gap-4">
          <Scale className="h-10 w-10 text-slate-800" strokeWidth={1.5} />
          <p className="text-sm font-serif italic text-slate-700 leading-tight">
            Law is not just a profession,<br/>It's a commitment to justice.
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-sans">Generated by <span className="font-bold text-slate-900">Wukala-GPT</span></p>
          <p className="text-[9px] text-slate-400 font-sans mt-0.5">AI for Lawyers. Built for Pakistan.</p>
        </div>
      </div>
      
      <div className="text-center mt-8 text-[10px] text-slate-400 font-sans">
        Thank you for choosing our legal services.
      </div>
    </div>
  );
};
