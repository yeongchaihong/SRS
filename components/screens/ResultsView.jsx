import { useMemo } from "react";

export default function ResultsView({ 
  results, 
  scenario, 
  showNotAppropriate,
  onBack, 
  onToggleNotAppropriate, 
  onStartAgain 
}) {

  // Helper: Convert radiation string to score
  const getRadiationScore = (ratingString) => {
    if (!ratingString) return 0;
    const str = ratingString.toLowerCase();
    if (str.includes('0') && !str.includes('1')) return 0.5;
    if (str.includes('< 0.1') || str.includes('0.1')) return 1;
    if (str.includes('1-10')) return 5;
    if (str.includes('10-30')) return 8;
    if (str.includes('30-100') || str.includes('> 10')) return 10;
    const symbols = (ratingString.match(/☢/g) || []).length;
    if (symbols > 0) return symbols * 3;
    return 1;
  };

  // Filter results based on toggle state
  const visibleResults = useMemo(() => {
    if (showNotAppropriate) return results;
    return results.filter(r => r.appropriate !== 'not' && r.appropriate !== 'usually_not');
  }, [results, showNotAppropriate]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen relative overflow-hidden bg-slate-50">
      
      {/* 1. BACK BUTTON (Global) */}
      <div className="absolute top-0 -left-2 w-full pt-6 px-6 md:px-12 z-50 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 bg-slate-50/50 backdrop-blur-sm px-2 rounded-lg"
        >
          &lt; Back
        </button>
      </div>

      {/* =========================================================================
          MOBILE VIEW
         ========================================================================= */}
      <div className="flex lg:hidden flex-col w-full h-full pt-20 px-4 pb-4 bg-slate-50">
        
        {/* Mobile Header */}
        <div className="shrink-0 mb-4 px-2">
           <h2 className="font-extrabold text-2xl uppercase text-slate-900 leading-tight">
            Recommended Procedures
          </h2>
        </div>

        {/* MAIN FLEX CONTAINER (Handles Vertical Space) */}
        <div className="flex-1 min-h-0 flex flex-col gap-4">
            
            {/* 1. Context Area (Scenario + Controls) - Allows scrolling if screen is tiny, but stays at top usually */}
            <div className="shrink-0 flex flex-col gap-3">
                {/* Selected Scenario Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-100 pb-1">
                        Selected Scenario no. {scenario?.scenario_id || "N/A"}
                    </div>
                    <div className="text-slate-800 text-sm leading-snug font-medium line-clamp-2">
                        {scenario?.scenario || "No description available."}
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-row items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    {/* Legends */}
                    <div className="flex flex-row gap-1.5 shrink-0">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            <div className="w-2.5 h-2.5 rounded bg-[#90EE90] border border-green-200"></div> Usually
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                            <div className="w-2.5 h-2.5 rounded bg-[#FFFFE0] border border-yellow-200"></div> Maybe
                        </div>
                        {showNotAppropriate && (
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                                <div className="w-2.5 h-2.5 rounded bg-[#FFB6C1] border border-red-200"></div> Not
                            </div>
                        )}
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={onToggleNotAppropriate}
                        className={`px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all border shrink-0 text-center
                        ${showNotAppropriate 
                            ? 'bg-slate-100 border-slate-300 text-slate-700' 
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'}
                        `}
                    >
                        {showNotAppropriate ? 'Hide' : 'Show'} Not Appropriate
                    </button>
                </div>
            </div>

            {/* 2. THE GRAPH (Takes remaining space) */}
            <div className="flex-1 min-h-0 relative flex flex-col pl-6">
                
                {/* Y-Axis Label (Rotated Left) */}
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pointer-events-none whitespace-nowrap">
                  Appropriateness
                </div>

                {/* Graph Box */}
                <div className="flex-1 w-full flex flex-col border-l-2 border-b-2 border-slate-300 relative overflow-hidden bg-white rounded-tr-xl shadow-sm">
                    
                    {/* Internal Scroll Area for Bars */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                        {visibleResults.length > 0 ? (
                            visibleResults.map((item, index) => {
                                const score = getRadiationScore(item.rating);
                                const barColor = item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                                                item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                                                'bg-[#FFB6C1]';

                                return (
                                    <div key={index} className="flex flex-col w-full group">
                                        {/* Procedure Title */}
                                        <span className="text-xs font-bold text-slate-800 leading-tight mb-1 truncate">
                                            {item.procedure_name}
                                        </span>
                                        
                                        {/* Bar & Badge */}
                                        <div className="flex items-center gap-2 w-full">
                                            <div
                                                className={`h-5 rounded-r-md shadow-sm border border-black/5 ${barColor} transition-all duration-700`}
                                                style={{ width: `${Math.max(score * 10, 10)}%` }}
                                            ></div>
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 rounded whitespace-nowrap">
                                                {item.rating || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                No procedures found.
                            </div>
                        )}
                    </div>

                    {/* X-Axis Scale (Fixed Bottom) */}
                    <div className="flex justify-between w-full text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0 px-3 py-1.5 border-t border-slate-100 bg-slate-50 shrink-0">
                      <span>Low Rad</span>
                      <span>High Rad</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Bottom Button (Fixed Footer) */}
        <div className="pt-3 mt-auto border-t border-slate-200 bg-slate-50 shrink-0">
             <button
                onClick={onStartAgain}
                className="w-full py-3.5 rounded-xl font-bold text-lg text-white bg-slate-900 shadow-lg active:scale-[0.98]"
            >
                Start Again
            </button>
        </div>
      </div>


      {/* =========================================================================
          DESKTOP VIEW (Unchanged)
         ========================================================================= */}
      <div className="hidden lg:flex flex-1 h-full relative">
          
          {/* 2. LEFT: Graph Visualization Area */}
          <div className="flex-1 h-full relative bg-slate-100/50 flex flex-col overflow-hidden border-r border-slate-200 pt-24 px-8 pb-8">
            
            {/* Header */}
            <div className="shrink-0 mb-8">
               <h2 className="font-extrabold text-3xl mb-2 uppercase text-slate-900 leading-tight">
                Recommended Procedures
              </h2>
            </div>

            {/* --- THE GRAPH CONTAINER --- */}
            <div className="flex-1 min-h-0 relative flex flex-col pl-8">
                
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center font-bold text-sm text-slate-400 uppercase tracking-widest pointer-events-none whitespace-nowrap">
                  Appropriateness
                </div>

                <div className="flex-1 w-full flex flex-col border-l-2 border-b-2 border-slate-300 relative overflow-hidden bg-white/40 rounded-tr-xl">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                      {visibleResults.length > 0 ? (
                          visibleResults.map((item, index) => {
                          const score = getRadiationScore(item.rating);
                          const barColor = item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                                           item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                                           'bg-[#FFB6C1]';
                          return (
                              <div key={index} className="flex flex-col gap-1 w-full group">
                                  <span className="text-sm font-bold text-slate-800 ml-1 leading-tight truncate">
                                      {item.procedure_name}
                                  </span>

                                  <div className="flex items-center gap-3 w-full">
                                      <div
                                          className={`h-9 rounded-r-lg shadow-sm border border-black/5 transition-all duration-1000 ease-out relative group-hover:shadow-md ${barColor}`}
                                          style={{ width: `${Math.max(score * 10, 5)}%` }}
                                      >
                                      </div>
                                      <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md whitespace-nowrap">
                                          {item.rating || "N/A"}
                                      </span>
                                  </div>
                              </div>
                          );
                          })
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                            No procedures match current filters.
                          </div>
                      )}
                    </div>
                    <div className="flex justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-wider mt-0 px-4 py-2 border-t border-slate-200/50 bg-slate-50/80 shrink-0 backdrop-blur-sm z-10">
                      <span>Low Radiation</span>
                      <span>Medium Radiation</span>
                      <span>High Radiation</span>
                    </div>
                </div>
            </div>
          </div>

          {/* 3. RIGHT: Sidebar Controls & Legend */}
          <div className="w-[400px] shrink-0 h-full bg-white flex flex-col shadow-xl z-20">
            <div className="p-8 border-b border-slate-100 flex-1 overflow-y-auto">
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6">Legend</h3>
              <div className="space-y-5 bg-slate-50 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#90EE90] rounded-md shadow-sm border border-green-200/50"></div>
                  <span className="font-bold text-slate-700 text-sm uppercase">Usually Appropriate</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[#FFFFE0] rounded-md shadow-sm border border-yellow-200/50"></div>
                  <span className="font-bold text-slate-700 text-sm uppercase">Maybe Appropriate</span>
                </div>
                <div className={`flex items-center gap-4 transition-opacity duration-300 ${showNotAppropriate ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <div className="w-8 h-8 bg-[#FFB6C1] rounded-md shadow-sm border border-red-200/50"></div>
                    <span className="font-bold text-slate-700 text-sm uppercase">Not Appropriate</span>
                </div>
              </div>
            </div>
            <div className="p-8 mt-auto space-y-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={onToggleNotAppropriate}
                className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all border flex items-center justify-center gap-2
                  ${showNotAppropriate 
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' 
                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-sm'}
                `}
              >
                <span>{showNotAppropriate ? 'Hide' : 'Show'} "Not Appropriate"</span>
              </button>
              <button
                onClick={onStartAgain}
                className="w-full py-4 rounded-xl font-bold text-lg text-white bg-slate-900 hover:bg-black shadow-lg shadow-slate-300 transform transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Start Again</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.433l-.312-.311a7 7 0 00-11.712 3.138.75.75 0 001.449.39 5.5 5.5 0 019.201-2.466l.312.311H14.25a.75.75 0 000 1.5h4.242z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
      </div>

    </div>
  );
}