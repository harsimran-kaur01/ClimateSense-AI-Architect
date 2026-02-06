import React, { useState } from 'react';
import { DesignState, ClimateData, FloorPlan, RefinementResult, OptimizationEvaluation } from './types';
import { getClimateData, generateDesign, refineDesign, evaluateOptimization, getDiagnostics } from './services/geminiService';
import { FloorPlanViewer } from './components/FloorPlanViewer';
import { ClimateCard } from './components/ClimateCard';

const App: React.FC = () => {
  const [location, setLocation] = useState('');
  const [plotDimensions, setPlotDimensions] = useState('15m x 20m');
  const [priority, setPriority] = useState<'cooling' | 'daylight' | 'ventilation'>('daylight');
  const [requirements, setRequirements] = useState('3 bedrooms, open plan living, focus on eco-materials.');
  
  const [state, setState] = useState<DesignState>({
    isGenerating: false,
    isRefining: false,
    isEvaluating: false,
    isDiagnosing: false,
    history: []
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: undefined, 
      refinement: undefined, 
      optimizationVerdict: undefined,
      previousFloorPlan: undefined 
    }));

    try {
      const climate = await getClimateData(location, plotDimensions, priority);
      const plan = await generateDesign(climate, plotDimensions, requirements);

      setState(prev => ({
        ...prev,
        climate,
        floorPlan: plan,
        isGenerating: false,
        history: [...prev.history, `Designed for ${location}`]
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: err.message || 'Failed to generate design.' 
      }));
    }
  };

  const handleRefine = async () => {
    if (!state.floorPlan || !state.climate) return;

    setState(prev => ({ ...prev, isRefining: true }));

    try {
      const originalPlan = state.floorPlan;
      const refinement = await refineDesign(originalPlan, state.climate);
      
      setState(prev => ({
        ...prev,
        isRefining: false,
        refinement,
        previousFloorPlan: originalPlan,
        floorPlan: refinement.revised_floor_plan,
        history: [...prev.history, `Refined design for performance optimization`]
      }));

      // Auto-evaluate after refinement
      setState(prev => ({ ...prev, isEvaluating: true }));
      const verdict = await evaluateOptimization(refinement.revised_floor_plan.performanceMetrics);
      setState(prev => ({ ...prev, isEvaluating: false, optimizationVerdict: verdict }));
      
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isRefining: false, 
        isEvaluating: false,
        error: "Optimization cycle failed. Please try again." 
      }));
    }
  };

  const handleRunDiagnostics = async () => {
    if (!state.floorPlan) return;
    setState(prev => ({ ...prev, isDiagnosing: true }));
    try {
      const diagnostics = await getDiagnostics(state.floorPlan);
      setState(prev => ({
        ...prev,
        isDiagnosing: false,
        floorPlan: prev.floorPlan ? { ...prev.floorPlan, diagnostics } : undefined
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, isDiagnosing: false, error: "Diagnostic audit failed." }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
              ClimateSense <span className="text-emerald-600">AI</span>
            </h1>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">
            Autonomous Climate Architect
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Project Parameters
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Site Location (City or Region)</label>
                <input
                  type="text"
                  placeholder="e.g. Phoenix, Oslo, Cairo..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plot Dimensions</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={plotDimensions}
                    onChange={(e) => setPlotDimensions(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Goal</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="daylight">Daylight</option>
                    <option value="cooling">Cooling</option>
                    <option value="ventilation">Ventilation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Brief (Rooms/Style)</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none transition-all"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={state.isGenerating || state.isRefining || !location}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg active:scale-95"
              >
                {state.isGenerating ? 'Synthesizing Data...' : 'Start Autonomous Design'}
              </button>
            </form>
          </section>

          {state.error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold animate-pulse">
              ERROR: {state.error}
            </div>
          )}

          {state.climate && <ClimateCard data={state.climate} metrics={state.floorPlan?.performanceMetrics} />}
        </aside>

        <section className="lg:col-span-8 space-y-6">
          {!state.floorPlan && !state.isGenerating && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-400">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <p className="text-sm font-medium">Blueprint workspace ready</p>
            </div>
          )}

          {state.isGenerating && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-slate-200 rounded-2xl bg-white">
              <div className="text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-slate-800 font-black text-sm uppercase tracking-widest">Inference Engine Active</p>
                  <p className="text-slate-400 text-xs italic mt-2">Deducing climate patterns for {location}...</p>
                </div>
              </div>
            </div>
          )}

          {state.floorPlan && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                   <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{state.floorPlan.designTitle}</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Revision: {state.refinement ? 'Optimized V2' : 'Initial Draft'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRunDiagnostics}
                    disabled={state.isDiagnosing || state.isRefining}
                    className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {state.isDiagnosing ? 'Auditing...' : 'Diagnostic Audit'}
                  </button>
                  {!state.refinement && (
                    <button
                      onClick={handleRefine}
                      disabled={state.isRefining}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      {state.isRefining ? 'Refining...' : 'Refine & Optimize'}
                    </button>
                  )}
                </div>
              </div>

              <FloorPlanViewer plan={state.floorPlan} />

              {state.refinement && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-900/10 border border-emerald-200/50 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em]">Refinement Audit Log</h3>
                      <div className="px-2 py-1 bg-emerald-600 text-white text-[9px] font-bold rounded">SUCCESS</div>
                    </div>
                    <ul className="space-y-2">
                      {state.refinement.changes_made.map((change, i) => (
                        <li key={i} className="text-xs text-emerald-900 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">→</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <h3 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Quantified Improvements</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Thermal Efficiency</span>
                          <p className="text-[11px] text-slate-300 pr-4 leading-snug">{state.refinement.expected_improvements.heat}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-400">+{state.refinement.expected_improvements.heat_improvement_pct}%</span>
                          <div className="text-[9px] text-emerald-500 font-bold">REDUCTION</div>
                        </div>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex items-center justify-between group">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Passive Airflow</span>
                          <p className="text-[11px] text-slate-300 pr-4 leading-snug">{state.refinement.expected_improvements.airflow}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-sky-400">+{state.refinement.expected_improvements.airflow_improvement_pct}%</span>
                          <div className="text-[9px] text-sky-500 font-bold">VELOCITY</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Verdict Section */}
              {state.optimizationVerdict && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm overflow-hidden relative">
                   <div className={`absolute top-0 right-0 p-4 font-black text-[8px] uppercase tracking-widest ${state.optimizationVerdict.iterate ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {state.optimizationVerdict.iterate ? 'POTENTIAL FOR GAINS' : 'OPTIMIZED TO LIMIT'}
                   </div>
                   <h3 className="text-slate-800 font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2 inline-block">Future Optimization Potential</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-3 tracking-wider">Architect's Verdict</p>
                        <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-emerald-400 pl-4 py-1 bg-slate-50/50 rounded-r-lg">
                          "{state.optimizationVerdict.expected_benefit}"
                        </p>
                      </div>
                      {state.optimizationVerdict.iterate && (
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-3 tracking-wider">Recommended Adjustments</p>
                          <ul className="space-y-2">
                            {state.optimizationVerdict.recommended_adjustments.map((adj, i) => (
                              <li key={i} className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"></span>
                                {adj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-rose-100 pb-2 inline-block">Rejected Architectural Strategies</h3>
                <div className="grid grid-cols-1 gap-4">
                  {state.floorPlan.rejected_alternatives.map((alt, i) => (
                    <div key={i} className="flex flex-col md:flex-row gap-4 p-4 bg-rose-50/30 rounded-xl border border-rose-100/50">
                      <div className="md:w-1/3">
                        <h4 className="text-[11px] font-black text-rose-900 uppercase mb-1">{alt.option}</h4>
                        <div className="text-[9px] font-bold text-rose-400 uppercase">REJECTED OPTION</div>
                      </div>
                      <div className="md:w-2/3">
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{alt.reason_for_rejection}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
                </div>
                <h3 className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4 border-b border-emerald-100 pb-2 inline-block">Architectural Reasoning Statement</h3>
                <p className="text-xl leading-relaxed font-light text-slate-800 italic mb-8">
                  "{state.floorPlan.architectReasoning}"
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.floorPlan.rooms.filter(r => r.reasoning).slice(0, 6).map(room => (
                    <div key={room.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                      <h4 className="font-bold text-xs text-emerald-700 uppercase mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        {room.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal">{room.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div>© 2025 ClimateSense AI Studio</div>
          <div>Inferred Passive Design Engine v2.4</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
