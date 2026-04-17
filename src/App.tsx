/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Settings, 
  Download, 
  ExternalLink, 
  History, 
  Terminal,
  Sun,
  Moon,
  Filter,
  TrendingUp,
  Database,
  Globe,
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AcademicWork, 
  API_SOURCES, 
  searchWorks, 
  getDorkUrl, 
  getScholarUrl 
} from './services/api';

type Tab = 'papers' | 'books' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('papers');
  const [darkMode, setDarkMode] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState(API_SOURCES.OPENALEX);
  const [siteUrl, setSiteUrl] = useState('');
  const [results, setResults] = useState<AcademicWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{msg: string, time: string}[]>([]);
  const [history, setHistory] = useState<AcademicWork[]>([]);
  
  // Filters
  const [minYear, setMinYear] = useState(new Date().getFullYear() - 5);
  const [minCites, setMinCites] = useState(0);
  const [limit, setLimit] = useState(20);
  const [onlyOA, setOnlyOA] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addLog = (msg: string) => {
    setLogs(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (source === API_SOURCES.GOOGLE_SCHOLAR) {
      addLog(`Abriendo Google Scholar para: ${query}`);
      window.open(getScholarUrl(query, minYear), '_blank');
      return;
    }

    if (source === API_SOURCES.DORKING) {
      if (!siteUrl) {
        addLog('ERROR: Se requiere una URL para el dorking.');
        return;
      }
      addLog(`Iniciando Google Dork en: ${siteUrl}`);
      window.open(getDorkUrl(query, siteUrl), '_blank');
      return;
    }

    setLoading(true);
    addLog(`Buscando "${query}" en ${source}...`);
    
    try {
      const data = await searchWorks(query, source, { limit, minYear, minCites, onlyOA });
      setResults(data);
      addLog(`Misión finalizada: se han encontrado ${data.length} resultados.`);
      
      if (data.length > 0) {
        setHistory(prev => {
          const newHistory = [...data, ...prev];
          // Simple deduplication by id
          return Array.from(new Map(newHistory.map(item => [item.id, item])).values()).slice(0, 100);
        });
      }
    } catch (err) {
      addLog(`ERROR CRÍTICO: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-16 md:w-[240px] border-r border-white/10 bg-white/5 backdrop-blur-[20px] flex flex-col items-center md:items-stretch py-8 transition-all shrink-0">
        <div className="px-6 mb-12 flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] rounded-xl shadow-lg shadow-cyan-500/20">
              <TrendingUp size={24} className="text-slate-900" />
            </div>
            <h1 className="hidden md:block font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
              OMNIBIO v12
            </h1>
          </div>
          <p className="hidden md:block text-[10px] text-white/50 tracking-[2px] uppercase mt-2 ml-1">AI Research Suite</p>
        </div>

        <nav className="flex-1 px-3 space-y-2 w-full">
          <NavItem 
            icon={<FileText size={20} />} 
            label="Laboratorio" 
            active={activeTab === 'papers'} 
            onClick={() => setActiveTab('papers')} 
          />
          <NavItem 
            icon={<BookOpen size={20} />} 
            label="Biblioteca" 
            active={activeTab === 'books'} 
            onClick={() => setActiveTab('books')} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Historial" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Configuración" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="px-6 pt-6 border-t border-white/10 space-y-4">
          <div className="hidden md:block text-[11px] text-white/40 space-y-1">
             <p>Última sesión:</p>
             <p>• {history.length} Resultados</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 bg-white/5 backdrop-blur-[20px] z-10">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">
              {activeTab === 'papers' && 'Explorador de Artículos'}
              {activeTab === 'books' && 'Biblioteca de Libros'}
              {activeTab === 'history' && 'Registros Recientes'}
              {activeTab === 'settings' && 'Ajustes del Agente'}
            </h2>
            <p className="text-white/50 text-sm">
              {activeTab === 'papers' && 'Localiza evidencia científica en repositorios globales.'}
              {activeTab === 'books' && 'Busca literatura técnica y manuales académicos.'}
            </p>
          </div>

          {(activeTab === 'papers' || activeTab === 'books') && (
            <div className="flex items-center gap-3 max-w-xl flex-1 justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Keywords de investigación..."
                  className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#00f2fe]/50 outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:brightness-110 disabled:opacity-50 text-slate-900 px-8 py-3 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar Misión'}
              </button>
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              {(activeTab === 'papers' || activeTab === 'books') && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Filters Side */}
                  <div className="lg:col-span-1 space-y-6">
                    <section className="glass-card">
                      <div className="flex items-center gap-2 mb-4 text-[#00f2fe] font-bold">
                        <Database size={18} />
                        <h3 className="uppercase text-xs tracking-widest">Base de Datos</h3>
                      </div>
                      <select 
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#00f2fe]"
                      >
                        {Object.values(API_SOURCES).map(s => (
                          <option key={s} value={s} className="bg-slate-900">{s}</option>
                        ))}
                      </select>

                      {source === API_SOURCES.DORKING && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-bold text-white/50 mb-1 block uppercase tracking-widest">URL / Sitio Específico</label>
                          <input 
                            type="text" 
                            value={siteUrl}
                            onChange={(e) => setSiteUrl(e.target.value)}
                            placeholder="ej: unsl.edu.ar"
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-lg text-sm focus:ring-1 focus:ring-[#00f2fe] outline-none"
                          />
                        </div>
                      )}
                    </section>

                    <section className="glass-card">
                      <div className="flex items-center gap-2 mb-4 text-[#00f2fe] font-bold">
                        <Filter size={18} />
                        <h3 className="uppercase text-xs tracking-widest">Filtros Inteligentes</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="input-group flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Año Inicio</label>
                          <input 
                            type="number" 
                            value={minYear}
                            onChange={(e) => setMinYear(parseInt(e.target.value))}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#00f2fe]"
                          />
                        </div>

                        <div className="input-group flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Mín. Citaciones</label>
                          <input 
                            type="number" 
                            value={minCites}
                            onChange={(e) => setMinCites(parseInt(e.target.value))}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#00f2fe]"
                          />
                        </div>

                        <div className="input-group flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Cant. Máxima</label>
                          <select 
                            value={limit}
                            onChange={(e) => setLimit(parseInt(e.target.value))}
                            className="w-full p-2.5 bg-black/20 border border-white/10 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#00f2fe]"
                          >
                            <option value={10} className="bg-slate-900">10 resultados</option>
                            <option value={20} className="bg-slate-900">20 resultados</option>
                            <option value={50} className="bg-slate-900">50 resultados</option>
                            <option value={100} className="bg-slate-900">100 resultados</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox" 
                            checked={onlyOA}
                            onChange={(e) => setOnlyOA(e.target.checked)}
                            id="oa-check"
                            className="w-4 h-4 rounded border-white/10 bg-black/20 text-[#00f2fe] focus:ring-[#00f2fe]"
                          />
                          <label htmlFor="oa-check" className="text-xs font-bold text-white/70 cursor-pointer select-none uppercase tracking-wider">Solo Open Access</label>
                        </div>
                      </div>
                    </section>

                    {/* Mini Log */}
                    <section className="glass-card bg-black/30 text-white/80 p-5 font-mono text-[11px] overflow-hidden h-64 flex flex-col border border-white/5 shadow-inner">
                      <div className="flex items-center gap-2 mb-3 text-[#00f2fe] font-bold border-b border-white/10 pb-3">
                        <Terminal size={14} />
                        <span className="uppercase tracking-[2px] text-[10px]">Log agéntico</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                        {logs.length === 0 && <span className="text-white/20 italic">Aguardando instrucciones...</span>}
                        {logs.map((L, i) => (
                          <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 border-l-2 border-white/10 pl-2">
                            <span className="opacity-30 italic">{L.time.split(' ')[0]}</span>
                            <span className={L.msg.startsWith('ERROR') ? 'text-red-400' : L.msg.includes('finalizada') ? 'text-emerald-400' : ''}>{L.msg}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Results Main */}
                  <div className="lg:col-span-3 space-y-4">
                    {loading && (
                      <div className="flex flex-col items-center justify-center py-24 animate-in zoom-in-95">
                        <Loader2 size={48} className="text-[#00f2fe] animate-spin mb-6" />
                        <p className="text-[#00f2fe] font-bold text-sm tracking-widest uppercase">Razonando & Recuperando...</p>
                      </div>
                    )}
                    
                    {!loading && results.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-24 text-center glass-card border-dashed border-white/10 bg-white/5">
                        <AlertCircle size={48} className="text-white/10 mb-6" />
                        <h4 className="font-bold text-white uppercase tracking-widest text-sm mb-2">Sin actividad en el laboratorio</h4>
                        <p className="text-white/40 text-sm max-w-sm">Define el objetivo de investigación y ejecuta el agente para poblar la vista.</p>
                      </div>
                    )}

                    {!loading && results.map((work, idx) => (
                        <ResultCard key={work.id + idx} work={work} index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-20 glass-card">
                       <History size={48} className="text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-500">Aún no has realizado ninguna descarga o búsqueda exitosa.</p>
                    </div>
                  ) : (
                    history.map((work, i) => <ResultCard key={i} work={work} index={i} />)
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                 <div className="max-w-2xl mx-auto space-y-8 py-12">
                   <section className="glass-card">
                     <h3 className="font-bold text-xl mb-6">Personalización del Agente</h3>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">Notificaciones Visuales</p>
                            <p className="text-sm text-slate-500">Mostrar alertas en la consola al finalizar tareas.</p>
                          </div>
                          <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">Auto-Renombrado Inteligente</p>
                            <p className="text-sm text-slate-500">Formatear nombres de descarga como Autor - Año - Título.</p>
                          </div>
                          <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                     </div>
                   </section>

                   <section className="glass-card border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl">
                          <TrendingUp size={24} className="text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold">Elite Status</h4>
                          <p className="text-sm text-slate-500">Cuenta de investigador verificada. Acceso a APIs Premium activado.</p>
                        </div>
                      </div>
                   </section>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-center md:justify-start gap-4 p-3.5 rounded-xl transition-all relative
        ${active 
          ? 'bg-[#00f2fe]/10 text-[#00f2fe] border-l-[3px] border-[#00f2fe]' 
          : 'text-white/40 hover:bg-white/5 hover:text-white/70'}
      `}
    >
      <div className={active ? 'text-[#00f2fe]' : 'text-white/20 transition-colors'}>
        {icon}
      </div>
      <span className="hidden md:block font-bold text-[13px] uppercase tracking-wider">{label}</span>
      {active && <div className="absolute inset-0 bg-[#00f2fe]/5 blur-sm -z-10 rounded-xl" />}
    </button>
  );
}

interface ResultCardProps {
  work: AcademicWork;
  index: number;
  key?: string | number | null;
}

function ResultCard({ work, index }: ResultCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card hover:border-[#00f2fe]/30 transition-all duration-300 group relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        <div className="w-full md:w-16 h-16 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center shrink-0">
          {work.type === 'book' ? <BookOpen size={24} className="text-emerald-400" /> : <FileText size={24} className="text-[#00f2fe]" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00f2fe]/80 bg-[#00f2fe]/10 px-2.5 py-1 rounded-md border border-[#00f2fe]/20">
              {work.source}
            </span>
            <span className="text-xs font-mono text-white/30 flex items-center gap-1">
              {work.year || 'N/A'}
            </span>
          </div>
          
          <h3 className="font-display font-bold text-lg mb-1 group-hover:text-[#00f2fe] transition-colors truncate text-white">
            {work.title}
          </h3>
          
          {work.author && (
            <p className="text-sm text-white/40 flex items-center gap-2 mb-4">
              <Globe size={14} className="opacity-50" />
              {work.author}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
             {work.citations !== undefined && (
               <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                 <TrendingUp size={12} />
                 {work.citations} citas
               </div>
             )}
             
             {work.pdfUrl && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  PDF Disponible
                </div>
             )}
          </div>
        </div>

        <div className="flex md:flex-col gap-2 justify-center">
          {work.pdfUrl ? (
            <a 
              href={work.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3.5 bg-gradient-to-br from-[#00f2fe] to-[#4facfe] text-slate-900 rounded-xl hover:brightness-110 transition-all flex items-center justify-center"
              title="Descargar PDF"
            >
              <Download size={20} />
            </a>
          ) : (
            <div className="p-3.5 bg-white/5 border border-white/10 text-white/20 rounded-xl flex items-center justify-center cursor-not-allowed" title="PDF No Directo">
              <Download size={20} />
            </div>
          )}
          <a 
            href={work.pageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3.5 bg-black/40 border border-white/10 text-white/60 rounded-xl hover:border-[#00f2fe] hover:text-[#00f2fe] transition-all flex items-center justify-center"
            title="Ir a la Fuente"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
