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
  User,
  LogOut,
  CreditCard,
  Crown,
  History,
  X
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'motion/react';
import { ObfuscatorType, DeobfuscationResult } from './types';
import { deobfuscate, detectObfuscator, extractTriggers } from './lib/deobfuscators';
import { analyzeCodeStream, normalizeVariablesStream, scanVulnerabilitiesStream } from './lib/gemini';
import { CustomCursor } from './components/CustomCursor';
import { BackgroundMusic } from './components/BackgroundMusic';
import { logSecurityEvent, detectDevTools, monitorPerformance } from './lib/security';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';

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
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            credits: 10,
            isPremium: false,
            createdAt: serverTimestamp()
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        } else {
          // Listen for profile changes (credits, etc)
          onSnapshot(userDocRef, (doc) => {
            setUserProfile(doc.data());
          });
        }

        // Fetch initial history
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(10));
        const unsubscribeLogs = onSnapshot(q, (snapshot) => {
          const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHistoryLogs(logs);
        });

        addLog(`USER_SESSION: ${user.email} AUTHENTICATED`, 'success');
        return () => {
           unsubscribeLogs();
        };
      } else {
        setUserProfile(null);
        setHistoryLogs([]);
        addLog('USER_SESSION: GUEST_MODE_ACTIVE', 'info');
      }
      setIsAuthLoading(false);
    });

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addLog('SEC_NOTICE: BLOCK_CM', 'info');
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const isViolation = 
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u');

      if (isViolation) {
        e.preventDefault();
        addLog('SEC_VIOLATION: ACCESS_DENIED', 'warn');
        logSecurityEvent('DEVTOOLS_KEY_ATTEMPT', `Key: ${e.key}`);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    // Advanced Security Traps
    detectDevTools(() => {
      addLog('SEC_PROBE: DEBUGGER_TOOLS_DETECTED', 'warn');
      logSecurityEvent('DEVTOOLS_SUSPICION', 'Possible inspector window detected.');
    });

    monitorPerformance(() => {
      addLog('SEC_WARN: EXECUTION_DELAY_DETECTED', 'warn');
    });

    // Prevent Drag and Drop
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragstart', handleDrag);
    window.addEventListener('drop', handleDrag);

    addLog('NEURAL_FIREWALL_LOADED: V4.2_STABLE', 'success');

    // Run Anti-Debug in background
    const debugInterval = setInterval(() => {
      (function () { return false; })["constructor"]("debugger")();
    }, 2000);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
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
    if (!currentUser) {
      addLog('AUTH_REQUIRED: Please login to use AI functions', 'warn');
      return;
    }
    if (userProfile?.credits <= 0) {
      addLog('CREDITS_EXHAUSTED: Upgrade to Premium', 'warn');
      return;
    }
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
      
      // Consume 1 credit
      await updateDoc(doc(db, 'users', currentUser.uid), {
        credits: increment(-1)
      });

      const fullRecoveredCode = await analyzeCodeStream(output.content, selectedObfs.join(' + '), (chunk) => {
        setAiAnalysis(chunk);
      });
      
      // Log the deobfuscation
      await addDoc(collection(db, 'logs'), {
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        originalSnippet: output.content.slice(0, 5000), // Sample
        resultSnippet: fullRecoveredCode?.slice(0, 5000),
        modelUsed: 'gemini-2.0-flash'
      });

      if (fullRecoveredCode) {
        const newTriggers = extractTriggers(fullRecoveredCode);
        if (newTriggers.length > 0) {
          setTriggers(prev => Array.from(new Set([...prev, ...newTriggers])));
        }
      }
      setStatus('ANALYSIS_SYNCED');
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
    if (!currentUser) {
      addLog('AUTH_REQUIRED: Login to scan vulnerabilities', 'warn');
      return;
    }
    if (userProfile?.credits <= 0) {
      addLog('CREDITS_EXHAUSTED: Upgrade requested', 'warn');
      return;
    }
    if (!output?.content) return;
    setIsScanningVulnerabilities(true);
    setStatus('SCANNING_VULNERABILITIES...');
    setAiAnalysis(null);
    addLog('Scanning for security flaws...', 'warn');
    
    try {
      setAiAnalysis(''); 
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        credits: increment(-1)
      });

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

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff00] font-sans selection:bg-green-500/30 game-hud">
      <CustomCursor />
      <BackgroundMusic />
      {/* Game HUD Frame */}
      <div className="fixed inset-0 border-[10px] border-[#00ff00]/10 pointer-events-none z-[60] flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 px-10 py-2 border-x border-b border-[#00ff00]/20 bg-[#050505] terminal-title text-[10px] tracking-widest text-[#00ff00]/60">
          By from Alzaabi Team
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
          {currentUser ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 border-r border-[#00ff00]/20 pr-6">
                 <button 
                   onClick={() => setIsHistoryOpen(true)}
                   className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors flex flex-col items-center gap-1 group"
                 >
                    <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] uppercase font-black">History</span>
                 </button>
                 <div className="text-right">
                    <p className="text-[10px] uppercase opacity-40">Credits Available</p>
                    <div className="flex items-center gap-2 justify-end">
                       <Zap className="w-3 h-3 text-yellow-400" />
                       <span className="font-black text-[#00ff00]">{userProfile?.credits || 0}</span>
                    </div>
                 </div>
                 {userProfile?.isPremium ? (
                   <div className="bg-yellow-400/20 border border-yellow-400 px-2 py-1 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-400" />
                      <span className="text-[10px] font-black text-yellow-400 uppercase">Premium</span>
                   </div>
                 ) : (
                   <button className="bg-green-500/10 border border-green-500 text-green-500 px-2 py-1 text-[9px] font-black uppercase hover:bg-green-500 hover:text-black transition-all">
                      Upgrade
                   </button>
                 )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold">{currentUser.displayName}</p>
                  <p className="text-[9px] text-[#00ff00]/40 font-mono tracking-tighter shrink-0">{currentUser.email}</p>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-10 h-10 border border-red-500/30 flex items-center justify-center hover:bg-red-500/10 transition-all text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              disabled={isAuthLoading}
              className="bg-[#00ff00] hover:bg-[#00ff00]/80 text-black px-6 py-2 font-black uppercase tracking-widest shadow-[0_0_15px_#00ff00] transition-all flex items-center gap-2"
            >
              {isAuthLoading ? <Activity className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              Access Kernel (Login)
            </button>
          )}
        </div>
      </header>

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
      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl max-h-[80vh] bg-black border border-[#00ff00]/20 shadow-[0_0_50px_rgba(0,255,0,0.1)] flex flex-col"
            >
              <div className="p-6 border-b border-[#00ff00]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-[#00ff00]" />
                  <h2 className="text-xl font-black uppercase tracking-tighter terminal-title">Neural Logs_History</h2>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="text-[#00ff00]/40 hover:text-[#00ff00]">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-4 custom-scrollbar">
                {historyLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <Activity className="w-12 h-12 mb-4 animate-pulse" />
                    <p className="font-mono text-sm uppercase">No logs detected in local buffer</p>
                  </div>
                ) : (
                  historyLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-[#00ff00]/5 border border-[#00ff00]/10 hover:border-[#00ff00]/30 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <code className="text-[10px] bg-[#00ff00]/20 px-2 py-1 text-[#00ff00] rounded">ID: {log.id.slice(0, 8)}</code>
                          <span className="text-[10px] opacity-40 uppercase font-mono">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Processing...'}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            const finalContent = log.resultSnippet;
                            setInput(log.originalSnippet);
                            setOutput({ 
                              success: true, 
                              content: finalContent, 
                              type: (log.modelUsed || 'Luraph') as ObfuscatorType 
                            });
                            setIsHistoryOpen(false);
                            addLog('LOG_RESTORED: Sequence loaded into buffer', 'success');
                          }}
                          className="bg-[#00ff00] text-black text-[10px] font-black px-4 py-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Restore State
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase opacity-40">Original Source</p>
                          <pre className="text-[9px] font-mono p-2 bg-black/40 border border-white/5 line-clamp-3 overflow-hidden">
                            {log.originalSnippet}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase opacity-40">Recovered Logic</p>
                          <pre className="text-[9px] font-mono p-2 bg-black/40 border border-white/5 line-clamp-3 overflow-hidden text-[#00ff00]/60">
                            {log.resultSnippet}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
