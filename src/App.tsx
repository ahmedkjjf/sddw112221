/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  FileCode2, 
  Terminal, 
  ShieldAlert, 
  Copy, 
  Trash2, 
  Zap, 
  BrainCircuit, 
  Info,
  ChevronRight,
  Database,
  Lock,
  Binary,
  Download,
  Search,
  Activity,
  Cpu,
  Radio,
  Radar,
  Upload,
  Layers,
  ShieldCheck,
  ZapOff,
  Wand2,
  ListRestart,
  X,
  MapPin,
  Globe,
  Wifi,
  Battery,
  User,
  Monitor
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'motion/react';
import { ObfuscatorType, DeobfuscationResult } from './types';
import { deobfuscate, detectObfuscator, extractTriggers } from './lib/deobfuscators';
import { analyzeCodeStream, normalizeVariablesStream, scanVulnerabilitiesStream } from './lib/gemini';
import { CustomCursor } from './components/CustomCursor';
import { BackgroundMusic } from './components/BackgroundMusic';
import { logSecurityEvent, detectDevTools, monitorPerformance, getVisitorIntel, validateEnvironment } from './lib/security';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './lib/firebase';

const OBFS: ObfuscatorType[] = [
  'Luraph', 'MoonSec', 'Xenon', 'IronBrew', 'PS-Obf', 'Synapse', 'Aclat', 'Ganlv', 'XOR', 'Base64', 'Hex-Enc', 'Zlib', 'GSC', 'Bytecode', 'Asset', 'Protector', 'VM-Obf', 'K-Deobf', 'Minified'
];

export default function App() {
  const [selectedObfs, setSelectedObfs] = useState<ObfuscatorType[]>(['Luraph']);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<DeobfuscationResult | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [isScrambling, setIsScrambling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [status, setStatus] = useState<string>('SYSTEM_READY');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [uid, setUid] = useState('285637FB');
  const [systemLogs, setSystemLogs] = useState<{msg: string, type: 'info' | 'warn' | 'success'}[]>([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isScanningVulnerabilities, setIsScanningVulnerabilities] = useState(false);
  // Removed login states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [visitorIntel, setVisitorIntel] = useState<any>(null);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => validateEnvironment());

  useEffect(() => {
    // Re-check just in case, though initialized by function
    const authorized = validateEnvironment();
    setIsAuthorized(authorized);
    if (!authorized) return;

    // Show Security Intel on start
    const loadIntel = async () => {
      const intel = await getVisitorIntel();
      setVisitorIntel(intel);
    };
    loadIntel();

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addLog('SEC_NOTICE: BLOCK_CM', 'info');
      logSecurityEvent('RIGHT_CLICK_INTERCEPT', 'User attempted to open context menu.');
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Save, Print, View Source
      const isViolation = 
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'p');

      if (isViolation) {
        e.preventDefault();
        addLog('SEC_VIOLATION: ACCESS_DENIED', 'warn');
        logSecurityEvent('TAMPER_KEY_COMBO', `Key attempt: ${e.key}`);
        setStatus('ACCESS_LOCKED');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addLog('SEC_WARN: COPY_PREVENTED', 'warn');
      logSecurityEvent('COPY_ATTEMPT', 'User tried to copy site content.');
      setStatus('ACCESS_LOCKED');
    };

    const handleSelect = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('selectstart', handleSelect);
    
    // Advanced Security Traps
    detectDevTools(() => {
      addLog('SEC_PROBE: DEBUGGER_TOOLS_DETECTED', 'warn');
      logSecurityEvent('DEVTOOLS_SUSPICION', 'Possible inspector window detected.');
      setStatus('ACCESS_LOCKED');
    });

    monitorPerformance(() => {
      addLog('SEC_WARN: EXECUTION_DELAY_DETECTED', 'warn');
      logSecurityEvent('PERFORMANCE_ANOMALY', 'Execution lag detected. Possible debugging/probing attempt.');
      // Do not lock UI for lag anymore, just log and warn
    });

    // Prevent Drag and Drop
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragstart', handleDrag);
    window.addEventListener('drop', handleDrag);

    addLog('NEURAL_FIREWALL_LOADED: V5.0_MAX_SEC', 'success');

    // Run Anti-Debug in background
    const debugInterval = setInterval(() => {
      (function () { return false; })["constructor"]("debugger")();
    }, 2000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('selectstart', handleSelect);
      window.removeEventListener('dragstart', handleDrag);
      window.removeEventListener('drop', handleDrag);
      clearInterval(debugInterval);
    };
  }, []);

  // Auto-detection logic deactivated to prevent conflicts with layered deobfuscation

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setSystemLogs(prev => [...prev.slice(-9), { msg, type }]);
  };

  const calculateSecurityScore = (foundTriggers: string[]) => {
    const weights: Record<string, number> = { 'Server': 15, 'Client': 5, 'Network': 10, 'Filesystem': 12, 'Suspicious': 20 };
    let score = 0;
    foundTriggers.forEach(t => {
      const type = t.split(':')[0] || 'Suspicious';
      score += weights[type] || 5;
    });
    return Math.min(score, 100);
  };

  const handleDeobfuscate = async () => {
    if (!input.trim()) {
      setStatus('يرجى إدخال شيفرة برمجية أولاً');
      return;
    }
    setIsLoading(true);
    setStatus('جاري فك التشفير الطبقي...');
    setAiAnalysis(null);
    setTriggers([]);
    setSecurityScore(0);
    setSystemLogs([{ msg: 'Initializing Kernel...', type: 'info' }]);
    
    try {
      let currentContent = input;
      addLog('Scanning memory buffers...', 'info');
      
      for (const obf of selectedObfs) {
        addLog(`Peeling layer: ${obf}`, 'info');
        try {
          const result = await deobfuscate(obf, currentContent);
          if (result.success) {
            currentContent = result.content;
            addLog(`Layer ${obf} bypassed`, 'success');
          } else {
            addLog(`Weak link in ${obf} detected`, 'warn');
          }
        } catch (e) {
          console.warn(`Layer ${obf} failed`);
          addLog(`Failed to bypass ${obf}`, 'warn');
        }
      }

      const finalTriggers = extractTriggers(currentContent);
      setTriggers(finalTriggers);
      setSecurityScore(calculateSecurityScore(finalTriggers));
      addLog('Extraction complete. Threat lvl: ' + calculateSecurityScore(finalTriggers) + '%', 'warn');

      const finalResult: DeobfuscationResult = {
        content: currentContent,
        type: selectedObfs[selectedObfs.length - 1],
        success: true
      };
      
      setOutput(finalResult);
      setStatus('SYSTEM_RECONSTRUCTING_LOGIC...');
      addLog('Reconstructing logic flow...', 'info');

      if (currentContent.length > 30000) {
        addLog('LARGE_INPUT_DETECTED: STABILITY_WARN', 'warn');
      }

      // Start Scrambling Effect - Enhanced "Hacker" Sequence (approx 5s total)
      setIsScrambling(true);
      const chars = '01#@$%^&*<>?/';
      let scrambleTimer = 0;
      
      addLog('INITIATING_VISUAL_RECONSTRUCTION...', 'info');

      const scrambleInterval = setInterval(() => {
        // Only scramble top portion for performance, but make it look dense
        const scrambled = currentContent
          .split('\n')
          .slice(0, 40) 
          .map(line => {
            const length = Math.min(line.length, 100);
            return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
          })
          .join('\n');
          
        setDisplayedContent(scrambled);
        scrambleTimer += 200;

        if (scrambleTimer >= 4000) { // 4 seconds of scramble
          clearInterval(scrambleInterval);
          setIsScrambling(false);
          addLog('DECRYPTION_STABILIZED', 'success');
          startTypingEffect(currentContent);
        }
      }, 200);

    } catch (error) {
      console.error(error);
      setStatus('CRITICAL_ERROR');
      addLog('KERNEL_PANIC: DECODER_CRASHED', 'warn');
    } finally {
      setIsLoading(false);
    }
  };

  const startTypingEffect = (fullText: string) => {
    let index = 0;
    // Step calculation for a more realistic "typing" reveal (takes roughly 3-4 seconds)
    const step = Math.max(Math.ceil(fullText.length / 50), 20);
    
    setDisplayedContent('');
    addLog('STREAMING_CODE_TO_BUFFER...', 'info');
    
    const typingInterval = setInterval(() => {
      index += step;
      if (index >= fullText.length) {
        setDisplayedContent(fullText);
        setStatus('PROCESS_COMPLETE');
        addLog('ACCESS_GRANTED: LOGIC_RESTORED', 'success');
        clearInterval(typingInterval);
      } else {
        // Add a cursor character for the "writing" effect
        setDisplayedContent(fullText.slice(0, index) + ' █');
      }
    }, 40);
  };

  const handleAiAnalyze = async () => {
    if (!output?.content) {
      setStatus('ERR: DECODE_FIRST');
      return;
    }
    setIsAiLoading(true);
    setAiAnalysis(null);
    setStatus('جاري فك التشفير الكامل (دقة عالية)...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      setAiAnalysis('');
      
      const fullRecoveredCode = await analyzeCodeStream(output.content, selectedObfs.join(' + '), (chunk) => {
        setAiAnalysis(chunk);
      });
      
      // Log locally if possible or just proceed
      if (fullRecoveredCode) {
        const newTriggers = extractTriggers(fullRecoveredCode);
        if (newTriggers.length > 0) {
          setTriggers(prev => Array.from(new Set([...prev, ...newTriggers])));
        }
      }
      setStatus('ANALYSIS_COMPLETE');
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message?.includes('خطأ') 
        ? error.message 
        : 'SYSTEM_ERROR: AI_TIMEOUT. حاول مجدداً لاحقاً أو استعمل كوداً أصغر.';
      setAiAnalysis(errorMsg);
      setStatus('AI_FAIL');
      addLog('CRITICAL_RECOVERY_FAILURE', 'warn');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNormalize = async () => {
    if (!output?.content) return;
    setIsNormalizing(true);
    setStatus('HUMANIZING_VARIABLES...');
    setAiAnalysis(null);
    addLog('Analyzing variable dependencies...', 'info');
    
    try {
      setAiAnalysis(''); 
      const normalized = await normalizeVariablesStream(output.content, (chunk) => {
        setAiAnalysis(chunk);
      });
      addLog('Normalization sync complete', 'success');
      setStatus('PROCESS_COMPLETE');
    } catch (error: any) {
      addLog('Normalization parity error', 'warn');
      setAiAnalysis(error?.message || 'LOGIC_RECOVERY_ERROR');
      setStatus('SYSTEM_ERR');
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleScanVulnerabilities = async () => {
    if (!output?.content) return;
    setIsScanningVulnerabilities(true);
    setStatus('SCANNING_VULNERABILITIES...');
    setAiAnalysis(null);
    addLog('Scanning for security flaws...', 'warn');
    
    try {
      setAiAnalysis(''); 
      
      await scanVulnerabilitiesStream(output.content, (chunk) => {
        setAiAnalysis(chunk);
      });
      addLog('Security scan complete', 'success');
      setStatus('SCAN_COMPLETE');
    } catch (error: any) {
      addLog('Scan failure', 'warn');
      setAiAnalysis(error?.message || 'SCAN_INTERRUPTED');
      setStatus('SYSTEM_ERR');
    } finally {
      setIsScanningVulnerabilities(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus('تم النسخ إلى الحافظة');
    setTimeout(() => setStatus(output ? 'اكتمل بنجاح' : 'جاهز للعمل'), 2000);
  };

  const downloadFile = (text: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    setStatus('بدأ التحميل...');
    setTimeout(() => setStatus('أكتمل التحميل'), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
        setStatus('تم رفع الملف بنجاح');
      };
      reader.readAsText(file);
    }
  };

  const reset = () => {
    setInput('');
    setOutput(null);
    setAiAnalysis(null);
    setStatus('جاهز للعمل');
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center" dir="rtl">
        <div className="bg-red-500/5 border border-red-500/20 p-12 max-w-lg space-y-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/40" />
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto animate-pulse" />
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter italic">Unauthorized Deployment</h1>
            <p className="text-[#00ff00]/60 font-mono text-[11px] leading-relaxed uppercase">
              نظام الحماية: تم اكتشاف محاولة تشغيل الموقع من مصدر غير مصرح به.
              <br />
              يتم الآن تسجيل بيانات الجلسة وإرسال تقرير بالانتهاك.
            </p>
          </div>
          <div className="pt-6 border-t border-red-500/10">
            <p className="text-[9px] text-red-500/40 font-mono uppercase tracking-[0.5em]">
              ERR_CODE: CLONE_DETECTION_V5_STRIKE // BY ALZAABI TEAM
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff00] font-sans selection:none user-select-none game-hud">
      <CustomCursor />
      <BackgroundMusic />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .user-select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}} />

      {/* Security Alert Overlay (Anti-Tamper) */}
      <AnimatePresence>
        {status === 'ACCESS_LOCKED' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-red-950/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full bg-black border-2 border-red-500 shadow-[0_0_100px_rgba(255,0,0,0.4)] p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
               <div className="flex items-center gap-4 mb-8">
                  <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce" />
                  <div>
                    <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter">System Violation Detected</h2>
                    <p className="text-red-500/60 text-xs font-mono uppercase tracking-widest">Unauthorized Access Attempt Logged</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                     <div className="p-4 bg-red-500/10 border border-red-500/20">
                        <p className="text-[10px] text-red-500/40 uppercase mb-1">Target Intel</p>
                        <p className="font-mono text-sm text-red-500">IP: 194.23.45.102</p>
                        <p className="font-mono text-sm text-red-500">LOC: RIYADH, SAUDI ARABIA</p>
                     </div>
                     <div className="p-4 bg-red-500/10 border border-red-500/20">
                        <p className="text-[10px] text-red-500/40 uppercase mb-1">Violation_Type</p>
                        <p className="font-mono text-sm text-red-500">TAMPER_BUFFER_PROBE</p>
                     </div>
                  </div>
                  <div className="relative aspect-square border border-red-500/40 bg-red-500/5 group">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Radar className="w-12 h-12 text-red-500/20 animate-spin" />
                     </div>
                     <img 
                       src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" 
                       alt="Satellite" 
                       className="w-full h-full object-cover opacity-40 grayscale sepia hue-rotate-[320deg] contrast-150"
                     />
                     <div className="absolute inset-0 border-[20px] border-transparent border-t-red-500/20 border-l-red-500/20" />
                     <div className="absolute bottom-2 left-2 text-[8px] text-red-500 font-black uppercase">Satellite_Uplink: Active</div>
                  </div>
               </div>

               <button 
                 onClick={() => setStatus('SYSTEM_READY')}
                 className="w-full py-4 bg-red-500 text-black font-black uppercase tracking-widest hover:bg-red-400 transition-all"
               >
                 Acknowledge & Clear Buffer
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomCursor />
      <BackgroundMusic />
      {/* Game HUD Frame */}
      <div className="fixed inset-0 border-[10px] border-[#00ff00]/10 pointer-events-none z-[60] flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 px-10 py-2 border-x border-b border-[#00ff00]/20 bg-[#050505] terminal-title text-[10px] tracking-widest text-[#00ff00]/60">
          By Alzaabi Team
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-[#00ff00]/20 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#00ff00] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.3)]">
            <Activity className="text-[#00ff00] w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold terminal-title uppercase">NEURAL DECODER PRO</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#00ff00]/50">Advanced SaaS Cyber Security Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end border-r border-[#00ff00]/20 pr-4">
            <span className="text-[8px] opacity-40 uppercase tracking-widest font-mono">Kernel_Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading || isAiLoading ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : 'bg-[#00ff00] shadow-[0_0_10px_#00ff00]'}`} />
              <span className="text-[10px] font-mono text-[#00ff00] font-black">{status}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 border border-[#00ff00]/30 bg-[#00ff00]/5">
                <ShieldCheck className="w-4 h-4 text-[#00ff00]" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-[#00ff00]">Neural Firewall Active</span>
             </div>
             <button 
               onClick={() => setIsIntelOpen(true)}
               className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors flex flex-col items-center gap-1 group"
             >
                <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] uppercase font-black">Security Intel</span>
             </button>
          </div>
        </div>
      </header>

      {/* Security Intel Modal */}
      <AnimatePresence>
        {isIntelOpen && visitorIntel && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsIntelOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-black border border-[#00ff00]/30 shadow-[0_0_50px_rgba(0,255,0,0.2)] p-8 overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff00] to-transparent animate-pulse" />
               
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                     <Radar className="w-10 h-10 text-[#00ff00] animate-spin" />
                     <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Visitor_Intelligence_Sync</h2>
                        <p className="text-[10px] text-[#00ff00]/40 uppercase font-mono tracking-widest">Real-time meta-data extraction</p>
                     </div>
                  </div>
                  <button onClick={() => setIsIntelOpen(false)} className="text-[#00ff00]/40 hover:text-[#00ff00]">
                    <X className="w-6 h-6" />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="space-y-4">
                     <div className="p-4 bg-[#00ff00]/5 border border-[#00ff00]/10 flex items-start gap-4">
                        <Radio className="w-5 h-5 text-[#00ff00] mt-1" />
                        <div>
                           <p className="text-[9px] text-[#00ff00]/40 uppercase mb-1">Network_Identity</p>
                           <p className="font-mono text-xs text-[#00ff00]"><span className="opacity-40">IP:</span> {visitorIntel.ip}</p>
                           <p className="font-mono text-xs text-[#00ff00] leading-tight mt-1"><span className="opacity-40">ISP:</span> {visitorIntel.network}</p>
                           <p className="font-mono text-[9px] text-[#00ff00]/60 uppercase mt-2">ASN: {visitorIntel.asn}</p>
                           <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                 <Wifi className="w-3 h-3 text-[#00ff00]/40" />
                                 <span className="text-[9px] font-mono text-[#00ff00]/60">{visitorIntel.client.connection}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="p-4 bg-[#00ff00]/5 border border-[#00ff00]/10 flex items-start gap-4">
                        <Globe className="w-5 h-5 text-[#00ff00] mt-1" />
                        <div>
                           <p className="text-[9px] text-[#00ff00]/40 uppercase mb-1">Geospatial_Loc</p>
                           <p className="font-mono text-xs text-[#00ff00]">{visitorIntel.location}</p>
                           <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Timezone</p>
                                 <p className="text-[9px] text-[#00ff00]/60 font-mono">{visitorIntel.timezone}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Currency</p>
                                 <p className="text-[9px] text-[#00ff00]/60 font-mono">{visitorIntel.currency}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="p-4 bg-[#00ff00]/5 border border-[#00ff00]/10 flex items-start gap-4">
                        <Battery className="w-5 h-5 text-[#00ff00] mt-1" />
                        <div>
                           <p className="text-[9px] text-[#00ff00]/40 uppercase mb-1">Power_Matrix</p>
                           <p className="font-mono text-xs text-[#00ff00] uppercase">{visitorIntel.client.battery}</p>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-[#00ff00]/5 border border-[#00ff00]/10 flex items-start gap-4">
                        <Monitor className="w-5 h-5 text-[#00ff00] mt-1" />
                        <div>
                           <p className="text-[9px] text-[#00ff00]/40 uppercase mb-1">Hardware_Profile</p>
                           <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Cores</p>
                                 <p className="text-[10px] text-[#00ff00] font-mono">{visitorIntel.client.cores} CPU</p>
                              </div>
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Memory</p>
                                 <p className="text-[10px] text-[#00ff00] font-mono">{visitorIntel.client.memory}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Display</p>
                                 <p className="text-[10px] text-[#00ff00] font-mono">{visitorIntel.client.screen}</p>
                              </div>
                              <div>
                                 <p className="text-[8px] opacity-40 uppercase">Platform</p>
                                 <p className="text-[10px] text-[#00ff00] font-mono">{visitorIntel.client.platform}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="relative aspect-video border border-[#00ff00]/20 overflow-hidden bg-black/50">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <MapPin className="w-8 h-8 text-[#00ff00] animate-bounce z-10" />
                        </div>
                        {visitorIntel.coords.lat && (
                           <img 
                              src={`https://static-maps.yandex.ru/1.x/?ll=${visitorIntel.coords.lon},${visitorIntel.coords.lat}&size=450,450&z=10&l=map&pt=${visitorIntel.coords.lon},${visitorIntel.coords.lat},pm2rdl`}
                              alt="Target Map"
                              className="w-full h-full object-cover opacity-60 grayscale brightness-150 contrast-125 select-none"
                              referrerPolicy="no-referrer"
                           />
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-[#00ff00]/40 text-[8px] font-black uppercase z-20">
                           Neural_Trace_Uplink: ENGAGED
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 border border-[#00ff00]/40 text-[8px] font-black uppercase z-20 font-mono">
                           {visitorIntel.coords.lat}, {visitorIntel.coords.lon}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-4 border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-500 leading-relaxed font-medium uppercase font-mono">
                     Note: This information is extracted via Neural Firewall logic. Your meta-data is currently being synchronized with our security database to ensure protection against unauthorized re-obfuscation.
                  </p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="container max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-20">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-black/40 border border-[#00ff00]/20 p-4 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,0,0.05)]">
            <h2 className="text-[10px] font-bold text-[#00ff00]/60 uppercase tracking-widest mb-4 flex items-center gap-2 terminal-title">
              <Cpu className="w-3 h-3" /> ALGORITHMS
            </h2>
            <nav className="space-y-1">
              {OBFS.map((obf) => {
                const isActive = selectedObfs.includes(obf);
                return (
                  <button
                    key={obf}
                    onClick={() => {
                      if (isActive && selectedObfs.length > 1) {
                        setSelectedObfs(prev => prev.filter(t => t !== obf));
                      } else if (!isActive) {
                        setSelectedObfs(prev => [...prev, obf]);
                      }
                    }}
                    className={`w-full text-right px-4 py-3 border-r-4 transition-all duration-300 flex items-center justify-between group ${
                      isActive 
                      ? 'border-[#00ff00] bg-[#00ff00]/10 text-[#00ff00] shadow-[0_0_15px_rgba(0,255,0,0.1)]' 
                      : 'border-transparent hover:border-[#00ff00]/50 text-[#00ff00]/40 hover:bg-[#00ff00]/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 border border-[#00ff00]/30 rounded-sm flex items-center justify-center transition-all ${isActive ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''}`}>
                        {isActive && <div className="w-1.5 h-1.5 bg-[#00ff00]" />}
                      </div>
                      <span className="font-mono text-sm tracking-tighter">{obf}</span>
                    </div>
                    {isActive ? <Radar className="w-3 h-3 text-[#00ff00]" /> : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="bg-black/40 border border-[#00ff00]/20 p-4 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff00]/5 -mr-12 -mt-12 rounded-full blur-2xl" />
            <h2 className="text-[10px] font-bold text-[#00ff00]/60 uppercase tracking-widest mb-4 flex items-center gap-2 terminal-title">
              <ShieldAlert className="w-3 h-3" /> THREAT_LEVEL
            </h2>
            <div className="relative pt-2">
              <div className="flex justify-between text-[10px] uppercase font-mono mb-1">
                <span>Safe</span>
                <span>Critical</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${securityScore}%` }}
                  className={`h-full shadow-[0_0_10px_#00ff00] ${
                    securityScore > 70 ? 'bg-red-500' : securityScore > 30 ? 'bg-yellow-500' : 'bg-[#00ff00]'
                  }`}
                />
              </div>
              <div className="mt-2 text-right">
                <span className={`text-xl font-black font-mono ${
                  securityScore > 70 ? 'text-red-500' : securityScore > 30 ? 'text-yellow-500' : 'text-[#00ff00]'
                }`}>
                  {securityScore}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-4 backdrop-blur-sm h-48 flex flex-col">
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2 terminal-title">
              <ListRestart className="w-3 h-3" /> SYSTEM_LOGS
            </h2>
            <div className="flex-1 overflow-auto space-y-1 pr-1 custom-scrollbar text-[9px] font-mono">
              <AnimatePresence initial={false}>
                {systemLogs.map((log, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`${
                      log.type === 'success' ? 'text-green-500' : 
                      log.type === 'warn' ? 'text-yellow-500' : 
                      'text-white/40'
                    }`}
                  >
                    <span className="mr-2">&gt;</span>
                    {log.msg}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {triggers.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#00ff00]/5 border border-[#00ff00]/30 p-4 shadow-[0_0_20px_rgba(0,255,0,0.1)]"
              >
                <h2 className="text-[10px] font-bold text-[#00ff00] uppercase tracking-widest mb-3 flex items-center gap-2 terminal-title">
                  <Radio className="w-3 h-3 animate-ping" /> EXTRACTED_EVENTS
                </h2>
                <div className="space-y-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                  {triggers.map((trigger, idx) => {
                    const [type, name] = trigger.includes(': ') ? trigger.split(': ') : ['Server', trigger];
                    return (
                      <div key={idx} className="bg-black/60 p-2 border-l-2 border-[#00ff00] border-y border-r border-[#00ff00]/20 flex flex-col gap-1 group select-text">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-bold px-1 uppercase ${
                            type === 'Server' ? 'bg-red-500/20 text-red-500' : 
                            type === 'Client' ? 'bg-blue-500/20 text-blue-500' : 
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {type}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(name)}
                            className="text-[8px] text-[#00ff00]/50 hover:text-[#00ff00] uppercase"
                          >نسخ الاسم</button>
                        </div>
                        <code className="text-[10px] text-green-100 break-all leading-tight">{name}</code>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Input Panel */}
          <section className="bg-black/60 border border-[#00ff00]/20 shadow-2xl relative">
            <div className="px-4 py-2 border-b border-[#00ff00]/20 bg-[#00ff00]/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ff00]" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#00ff00]/80 lowercase">input.io // script_buffer</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-1.5 px-2 py-1 border border-[#00ff00]/20 hover:bg-[#00ff00]/10 transition-all text-[#00ff00]/70 hover:text-[#00ff00]">
                  <Upload className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">رفع ملف</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".lua,.txt" />
                </label>
                <button onClick={reset} className="flex items-center gap-1.5 px-2 py-1 border border-red-900/20 hover:bg-red-900/10 transition-all text-red-500/50 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">مسح</span>
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-64 bg-transparent p-4 outline-none resize-none code-area text-base select-text"
              placeholder="-- PASTE THE OBFUSCATED SCRIPT HERE..."
              spellCheck="false"
              dir="ltr"
            />
            <div className="px-4 py-2 bg-[#00ff00]/5 flex items-center justify-end border-t border-[#00ff00]/10">
              <button
                onClick={handleDeobfuscate}
                disabled={isLoading}
                className="bg-[#00ff00] hover:bg-[#00ff00]/80 disabled:opacity-50 text-black px-6 py-2 font-black uppercase tracking-widest shadow-[0_0_15px_#00ff00] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {isLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                بدء التنظيف المبدئي
              </button>
            </div>
          </section>

          {/* Result Panel */}
          <AnimatePresence>
            {output && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 border border-[#00ff00]/20 shadow-2xl"
              >
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    {selectedObfs.map((obf, i) => (
                      <div key={obf} className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-center">
                           <Layers className={`w-3 h-3 ${i === selectedObfs.length - 1 ? 'text-[#00ff00]' : 'text-white/20'}`} />
                           <div className="h-4 w-px bg-white/10" />
                        </div>
                        <div className={`px-2 py-1 border text-[8px] font-bold uppercase tracking-widest ${
                          i === selectedObfs.length - 1 ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/10' : 'border-white/10 text-white/30'
                        }`}>
                          {obf}
                        </div>
                        {i < selectedObfs.length - 1 && <ChevronRight className="w-3 h-3 text-white/10" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-[#00ff00]/20 bg-[#00ff00]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00ff00]" />
                    <span className="text-[10px] font-mono font-bold text-[#00ff00]/80 uppercase">decompiled_source.lua</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => downloadFile(output.content, `extracted_${selectedObfs.join('_').toLowerCase()}.lua`)}
                      className="text-[#00ff00] hover:bg-[#00ff00]/10 px-2 py-1 text-[9px] font-bold border border-[#00ff00]/30 transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> تحميل الكود
                    </button>
                  </div>
                </div>
                
                <div className="p-4 relative">
                  <div className={`w-full max-h-[600px] overflow-auto bg-[#001000]/40 rounded shadow-inner custom-scrollbar transition-all duration-500`}>
                    {!isScrambling && status === 'PROCESS_COMPLETE' ? (
                      <SyntaxHighlighter 
                        language="lua" 
                        style={atomDark}
                        customStyle={{ background: 'transparent', padding: '1rem', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace' }}
                        wrapLines={true}
                      >
                        {displayedContent}
                      </SyntaxHighlighter>
                    ) : (
                      <pre className={`p-4 text-[0.8rem] font-mono leading-relaxed transition-all duration-300 ${isScrambling ? 'text-[#00ff00]/40' : 'text-blue-300'}`}>
                        {displayedContent}
                      </pre>
                    )}
                  </div>
                </div>

                <div className="px-4 py-4 bg-[#00ff00]/5 border-t border-[#00ff00]/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-[#00ff00]/80">
                    <BrainCircuit className="w-6 h-6 opacity-60" />
                    <div>
                      <p className="font-bold text-xs tracking-wide">الاسترجاع الشامل (Full AI Recovery)</p>
                      <p className="text-[8px] opacity-60 uppercase">Single-Click Neural Reconstruction</p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto">
                    <button
                      onClick={handleAiAnalyze}
                      disabled={isAiLoading || isNormalizing || isScanningVulnerabilities || !output.success}
                      className="w-full md:min-w-[240px] bg-green-500 hover:bg-green-400 text-black px-8 py-3 font-black uppercase tracking-tighter shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all flex items-center justify-center gap-3 text-sm group"
                    >
                      {isAiLoading ? <Activity className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                      استعادة وفك التشفير كاملاً
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* AI Analysis View */}
          <AnimatePresence mode="wait">
            {aiAnalysis ? (
              <motion.section
                key="analysis-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="bg-[#050505] border border-green-500/30 p-1 relative overflow-hidden shadow-[0_0_40px_rgba(0,255,0,0.05)]"
              >
                {isAiLoading && <div className="analyser-line" />}
                <div className="px-4 py-2 border-b border-green-500/30 bg-green-500/10 flex items-center justify-between relative z-20">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isAiLoading ? 'animate-pulse text-yellow-400' : 'text-green-400'}`} />
                    <h2 className="text-[10px] font-black text-green-100 uppercase tracking-widest terminal-title">
                      {isAiLoading ? 'SYSTEM_RECONSTRUCTING_LOGIC...' : 'ANALYSIS_REPORT_DUMP'}
                    </h2>
                  </div>
                  {!isAiLoading && (
                    <button 
                      onClick={() => downloadFile(aiAnalysis, `ai_analysis_${selectedObfs.join('_').toLowerCase()}.txt`)}
                      className="text-green-500 text-[9px] border border-green-500/50 px-2 py-0.5 hover:bg-green-500 hover:text-black transition-all uppercase font-bold"
                    >
                      تحميل التقرير
                    </button>
                  )}
                </div>
                
                {isAiLoading && (
                  <div className="loading-bar-container">
                    <div className="loading-bar-fill" />
                  </div>
                )}

                <div className="p-6 text-green-300 leading-relaxed font-mono text-sm max-w-none bg-black/80 max-h-[5000px] overflow-auto custom-ai-output relative z-10 scroll-smooth">
                  <div className="code-stream-enter">
                    <Markdown>{aiAnalysis}</Markdown>
                  </div>
                </div>
              </motion.section>
            ) : isAiLoading ? (
              <motion.section
                key="loading-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-black/60 border border-[#00ff00]/20 p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-2 border-green-500/20 rounded-full animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit className="w-8 h-8 text-green-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[#00ff00] font-bold terminal-title uppercase tracking-widest">تحميل المنطق البرمجي...</p>
                  <div className="w-48 mx-auto">
                    <div className="loading-bar-container">
                      <div className="loading-bar-fill" />
                    </div>
                  </div>
                  <p className="text-[8px] text-[#00ff00]/40 uppercase animate-pulse">Scanning Bytecode & Reconstructing Functions</p>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Retro HUD Decoration */}
      <div className="fixed bottom-10 right-10 flex gap-1 items-end z-40 opacity-30">
        {[40, 60, 30, 80, 50, 90, 20].map((h, i) => (
          <div key={i} className="w-1 bg-[#00ff00]" style={{ height: `${h}px` }} />
        ))}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 py-2 bg-black border-t border-[#00ff00]/10 z-50 px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[9px] text-[#00ff00]/40 tracking-[0.2em] font-mono uppercase">
          Alzaabi Team // جميع الحقوق محفوظة © {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4">
          <a 
            href="https://discord.gg/alzaabi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[9px] text-[#00ff00]/60 hover:text-[#00ff00] transition-colors font-mono tracking-widest border border-[#00ff00]/20 px-2 py-0.5 hover:bg-[#00ff00]/10 flex items-center gap-2"
          >
            ALZAABI TEAM
          </a>
          <p className="hidden sm:block text-[9px] text-[#00ff00]/20 tracking-[0.5em] font-mono">
            UID: {uid}
          </p>
        </div>
      </footer>
    </div>
  );
}
