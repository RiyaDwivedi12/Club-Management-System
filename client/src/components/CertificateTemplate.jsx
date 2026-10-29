import { useRef } from 'react';
import { Download, Printer, CheckCircle2, ShieldCheck, Trophy, X, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CertificateTemplate = ({ cert, onClose }) => {
  const printRef = useRef(null);

  if (!cert) return null;

  const recipientName = cert.recipientName || cert.userId?.name || cert.userName || 'Student Athlete';
  const rollNo = cert.roll_no || cert.userId?.roll_no || '';
  const gameName = cert.game || 'Sports Tournament';
  const matchDetails = cert.matchDetails || cert.achievement || 'Final Match Won';
  const tournamentTitle = cert.title || cert.tournamentId?.name || cert.tournamentName || 'Campus Championship';
  const teamLabel = cert.teamName ? `Representing ${cert.teamName}` : '';
  const signatoryName = cert.issuedByName || 'Kenneth Dorsen';
  const signatoryRole = cert.issuedByRole 
    ? (cert.issuedByRole === 'faculty' ? 'Faculty Coordinator' 
       : cert.issuedByRole === 'president' ? 'Club President' 
       : cert.issuedByRole === 'vice-president' ? 'Club Vice-President' 
       : 'Platform Administrator') 
    : 'League Commissioner';
  const signatoryTitle = `${signatoryRole.toUpperCase()}, CAMPUS SPORTS BOARD`;
  const issueDateObj = new Date(cert.issueDate || cert.createdAt || Date.now());
  const day = issueDateObj.getDate();
  const month = issueDateObj.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = issueDateObj.getFullYear();
  const getOrdinal = (n) => {
    if (n === 1 || n === 21 || n === 31) return 'ST';
    if (n === 2 || n === 22) return 'ND';
    if (n === 3 || n === 23) return 'RD';
    return 'TH';
  };
  const formattedDate = `PRESENTED ON THIS ${day}${getOrdinal(day)} DAY OF ${month}, ${year}.`;

  const downloadUrl = cert._id 
    ? `/api/certificates/${cert._id}/download`
    : (cert.pdfUrl || '#');

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    if (cert.verificationHash) {
      navigator.clipboard.writeText(cert.verificationHash);
      toast.success('Verification hash copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-gray-100 flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Official Athletic Merit Certificate</h3>
              <p className="text-xs text-gray-500 font-medium">Verified Credential • {cert.type?.toUpperCase() || 'AWARD'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyHash}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
              title="Copy Verification Hash"
            >
              <ShieldCheck size={15} className="text-primary-600" />
              <span>Copy Hash</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>

            <a
              href={downloadUrl}
              download={`Certificate-${recipientName.replace(/\s+/g, '_')}.pdf`}
              className="px-5 py-2 text-xs font-black text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-soft-purple transition-all flex items-center gap-1.5"
            >
              <Download size={15} />
              <span>Download PDF</span>
            </a>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors ml-1"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-4 sm:p-8 bg-slate-100/70 flex items-center overflow-x-auto">
          <div
            ref={printRef}
            id="printable-certificate"
            className="relative mx-auto bg-white w-[960px] min-w-[960px] h-[678px] shadow-2xl flex border border-gray-200 overflow-hidden select-none"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {/* LEFT MAIN AREA */}
            <div className="relative flex-1 flex flex-col items-center justify-between px-12 py-9 text-center bg-white overflow-hidden">
              
              {/* LAUREL WREATH WATERMARK (Behind content) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-0">
                <svg viewBox="0 0 500 500" className="w-[520px] h-[520px] text-slate-300 stroke-current fill-none">
                  <path d="M 120 400 C 60 280 80 160 250 80" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 380 400 C 440 280 420 160 250 80" strokeWidth="4" strokeLinecap="round" />
                  {/* Left Leaves */}
                  {[
                    [105, 360, -35], [90, 310, -45], [85, 260, -60],
                    [95, 210, -75], [120, 165, -90], [160, 125, -110], [210, 95, -135]
                  ].map(([x, y, rot], i) => (
                    <g key={`l-${i}`} transform={`translate(${x}, ${y}) rotate(${rot})`}>
                      <path d="M 0 0 C 15 -10 25 -5 30 10 C 20 15 10 10 0 0 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                      <path d="M 0 0 C 10 -20 20 -15 25 -5 C 15 0 5 0 0 0 Z" fill="#E2E8F0" />
                    </g>
                  ))}
                  {/* Right Leaves */}
                  {[
                    [395, 360, 35], [410, 310, 45], [415, 260, 60],
                    [405, 210, 75], [380, 165, 90], [340, 125, 110], [290, 95, 135]
                  ].map(([x, y, rot], i) => (
                    <g key={`r-${i}`} transform={`translate(${x}, ${y}) rotate(${rot})`}>
                      <path d="M 0 0 C -15 -10 -25 -5 -30 10 C -20 15 -10 10 0 0 Z" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                      <path d="M 0 0 C -10 -20 -20 -15 -25 -5 C -15 0 -5 0 0 0 Z" fill="#E2E8F0" />
                    </g>
                  ))}
                </svg>
              </div>

              {/* TOP HEADER & EMBLEM */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Red Athletic Ball / Swoosh Emblem */}
                <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-12 h-12">
                    <circle cx="50" cy="50" r="32" fill="#991B1B" />
                    <circle cx="58" cy="42" r="18" fill="#DC2626" />
                    {/* Seams */}
                    <path d="M 22 50 Q 50 48 78 50" stroke="#FFFFFF" strokeWidth="3" fill="none" />
                    <path d="M 50 22 Q 48 50 50 78" stroke="#FFFFFF" strokeWidth="3" fill="none" />
                    {/* Athletic Swoosh */}
                    <path d="M 20 60 C 10 80 50 90 85 45 C 70 65 35 70 20 60 Z" fill="#7F1D1D" />
                  </svg>
                </div>

                <div 
                  className="text-[12px] font-black uppercase text-slate-800 tracking-[0.22em] mb-1.5"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  CRESTMORE ELITE SPORTS ASSOCIATION
                </div>

                {/* MAIN TITLE */}
                <h1 
                  className="text-[52px] font-black leading-none text-[#1B365D] tracking-[0.08em] mt-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  CERTIFICATE
                </h1>

                <div 
                  className="text-[16px] font-semibold text-[#334E68] tracking-[0.24em] uppercase mt-2"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  OF PROFESSIONAL ATHLETIC MERIT
                </div>
              </div>

              {/* RECIPIENT SECTION */}
              <div className="relative z-10 flex flex-col items-center my-1 w-full max-w-2xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
                  THIS CERTIFICATE IS AWARDED TO
                </span>

                <div 
                  className="text-[52px] text-slate-900 leading-tight py-0.5 my-0.5 select-all"
                  style={{ fontFamily: "'Great Vibes', cursive" }}
                >
                  {recipientName}
                </div>

                {/* Position & Trophy Honors Badge */}
                {(() => {
                  const pos = cert.position || cert.achievement || (cert.type === 'winner' ? '1st Position' : cert.type === 'runner-up' ? '2nd Position' : cert.type === 'third-place' ? '3rd Position' : 'Participation');
                  const isFirst = pos.includes('1st') || pos.toLowerCase().includes('winner');
                  const isSecond = pos.includes('2nd') || pos.toLowerCase().includes('runner');
                  const isThird = pos.includes('3rd') || pos.toLowerCase().includes('third');

                  const badgeClass = isFirst
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-amber-300 shadow-sm'
                    : isSecond
                    ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 border-slate-300'
                    : isThird
                    ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white border-amber-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-500';

                  const icon = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '📜';

                  return (
                    <div className={`my-1 px-4 py-1 rounded-full text-xs font-black tracking-wider border uppercase flex items-center gap-1.5 ${badgeClass}`}>
                      <span>{icon}</span>
                      <span>{pos}</span>
                      <span>—</span>
                      <span>{gameName}</span>
                    </div>
                  );
                })()}

                {/* Roll Number & Class Name Badge */}
                {(cert.roll_no || cert.userId?.roll_no || cert.className || cert.department || cert.userId?.department || cert.teamName) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider my-1 font-mono">
                    {(cert.roll_no || cert.userId?.roll_no) && (
                      <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-800">
                        Roll No: {cert.roll_no || cert.userId?.roll_no}
                      </span>
                    )}
                    {(cert.className || cert.teamName) && (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-900 rounded-md border border-blue-200 font-bold">
                        Class: {cert.className || cert.teamName}
                      </span>
                    )}
                    {(cert.department || cert.userId?.department) && !(cert.className) && (
                      <span className="px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-800">
                        Dept: {cert.department || cert.userId?.department}
                      </span>
                    )}
                  </div>
                )}

                {/* CITATION */}
                <p className="text-[11px] uppercase font-semibold text-slate-700 tracking-[0.05em] leading-relaxed max-w-xl text-center mt-1">
                  IN RECOGNITION OF OUTSTANDING ATHLETIC EXCELLENCE, DEDICATION, AND SECURING {(cert.position || cert.achievement || 'HONORS').toUpperCase()} IN {gameName.toUpperCase()} AT THE {tournamentTitle.toUpperCase()}.
                </p>

                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.14em] mt-3">
                  {formattedDate}
                </p>
              </div>

              {/* BOTTOM ROW: SEAL, SIGNATURE, TROPHY */}
              <div className="relative z-10 w-full flex items-end justify-between px-4 pt-2">
                
                {/* BOTTOM LEFT: GOLDEN EMBOSSED SEAL */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Starburst Rosette */}
                    <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                      <polygon 
                        points="50,2 62,10 77,4 83,18 97,22 95,37 104,49 95,61 97,76 83,80 77,94 62,88 50,96 38,88 23,94 17,80 3,76 5,61 -4,49 5,37 3,22 17,18 23,4 38,10" 
                        fill="#D4AF37" 
                      />
                      <circle cx="50" cy="50" r="36" fill="#F59E0B" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#78350F" strokeWidth="1.5" />
                      <circle cx="50" cy="50" r="28" fill="none" stroke="#CA8A04" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="50" y="44" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#78350F" fontFamily="'Cinzel', serif">OFFICIAL</text>
                      <text x="50" y="52" textAnchor="middle" fontSize="9" fontWeight="900" fill="#78350F" fontFamily="'Cinzel', serif">★</text>
                      <text x="50" y="61" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#78350F" fontFamily="'Cinzel', serif">MERIT</text>
                    </svg>
                  </div>
                </div>

                {/* BOTTOM CENTER: SIGNATORY */}
                <div className="flex flex-col items-center text-center pb-1">
                  {/* Cursive Signature Effect */}
                  <div 
                    className="text-2xl text-slate-800 -mb-1 select-none pointer-events-none capitalize"
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                  >
                    {signatoryName}
                  </div>

                  <div className="w-56 h-[1.5px] bg-slate-300 mb-2"></div>

                  <span 
                    className="text-[13px] font-black tracking-[0.14em] uppercase text-slate-900"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {signatoryName.toUpperCase()}
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-600 mt-0.5">
                    {signatoryTitle}
                  </span>

                  {cert.verificationHash && (
                    <span className="text-[8px] font-mono font-semibold text-slate-400 mt-1 tracking-wider">
                      AUTH ID: {cert.verificationHash}
                    </span>
                  )}
                </div>

                {/* BOTTOM RIGHT: GOLDEN TROPHY CUP */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-24 flex items-center justify-center">
                    <svg viewBox="0 0 100 120" className="w-20 h-24 filter drop-shadow-md">
                      {/* Black Marble Pedestal Base */}
                      <rect x="25" y="98" width="50" height="14" rx="2" fill="#1E293B" />
                      <rect x="20" y="108" width="60" height="8" rx="2" fill="#0F172A" />
                      <rect x="42" y="86" width="16" height="12" fill="#D4AF37" />
                      
                      {/* Trophy Cup Body */}
                      <path 
                        d="M 28 32 L 72 32 C 72 65 60 86 50 86 C 40 86 28 65 28 32 Z" 
                        fill="#F59E0B" 
                      />
                      <ellipse cx="50" cy="32" rx="22" ry="6" fill="#FBBF24" />

                      {/* Handles */}
                      <path 
                        d="M 28 38 C 12 40 10 65 32 72 C 30 66 18 62 26 44" 
                        fill="none" 
                        stroke="#D4AF37" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 72 38 C 88 40 90 65 68 72 C 70 66 82 62 74 44" 
                        fill="none" 
                        stroke="#D4AF37" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                      />

                      {/* Star Badge on Cup */}
                      <polygon 
                        points="50,45 53,53 61,54 55,60 57,68 50,64 43,68 45,60 39,54 47,53" 
                        fill="#FFFFFF" 
                      />
                    </svg>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT CRIMSON GEOMETRIC PATTERN BORDER */}
            <div className="w-[62px] min-w-[62px] h-full bg-[#7E1522] relative overflow-hidden border-l-2 border-[#C59B27] flex flex-col items-center">
              {/* White Repeating Chevron / Zigzag Pattern */}
              <svg 
                className="w-full h-full text-white/90" 
                viewBox="0 0 60 700" 
                preserveAspectRatio="none"
              >
                <pattern id="chevronPattern" width="60" height="24" patternUnits="userSpaceOnUse">
                  {/* Left Column Chevron */}
                  <polyline 
                    points="14,2 28,12 14,22" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                  {/* Right Column Chevron */}
                  <polyline 
                    points="32,2 46,12 32,22" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </pattern>
                <rect width="100%" height="100%" fill="url(#chevronPattern)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Help Bar */}
        <div className="px-6 py-3.5 bg-gray-50 text-gray-500 text-xs font-semibold flex items-center justify-between border-t border-gray-100 print:hidden">
          <span className="flex items-center gap-1.5 text-gray-600">
            <CheckCircle2 size={16} className="text-green-600" />
            Cryptographically sealed & verifiable via official hash code.
          </span>
          <span className="text-gray-400">
            Tip: Click <strong>Download PDF</strong> for the official signed document, or <strong>Print</strong> to save directly.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
