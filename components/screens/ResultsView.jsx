import { HandWrittenTitle } from "../ui/hand-writing-text"; // Assuming you have this, or use standard text

export default function ResultsView({ 
  results, 
  showNotAppropriate,
  onBack, 
  onToggleNotAppropriate, 
  onStartAgain 
}) {

  // Helper: Convert radiation string to a 0-10 score for visual bar width
  const getRadiationScore = (ratingString) => {
    if (!ratingString) return 0;
    const str = ratingString.toLowerCase();
    
    // Logic based on typical ACR ratings
    if (str.includes('0') && !str.includes('1')) return 0.5; // "0 mSv" -> tiny bar
    if (str.includes('< 0.1') || str.includes('0.1')) return 1;
    if (str.includes('1-10')) return 5;
    if (str.includes('10-30')) return 8;
    if (str.includes('30-100') || str.includes('> 10')) return 10;
    
    // Fallback based on radiation symbols often found in text (☢)
    const symbols = (ratingString.match(/☢/g) || []).length;
    if (symbols > 0) return symbols * 3;
    
    return 1; // Default min width
  };

  return (
    <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out] text-black bg-white">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="flex flex-col items-center w-full h-full mt-4">
        <h2 className="text-5xl font-bold mb-12 tracking-wider font-handwritten">RECOMMENDED PROCEDURE</h2>

        <div className="w-full flex flex-row gap-12 h-full px-12">
          
          {/* Chart Area */}
          <div className="flex-1 flex flex-col relative border-l-2 border-b-2 border-black/50 p-4">
            <div className="absolute -left-12 top-1/2 -rotate-90 origin-center font-handwritten text-lg text-gray-500">
              Appropriateness
            </div>
            
            <div className="flex flex-col gap-6 w-full mt-auto mb-8 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {results.length > 0 ? (
                results.map((item, index) => {
                  const score = getRadiationScore(item.rating);
                  return (
                    <div key={index} className="flex flex-col gap-1 w-full group">
                      <div className="flex items-center gap-2 w-full">
                        {/* Bar */}
                        <div
                          className={`h-8 rounded-r-md transition-all duration-1000 ease-out flex items-center shadow-sm ${
                            item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                            item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                            'bg-[#FFB6C1]'
                          }`}
                          style={{ width: `${Math.max(score * 10, 2)}%` }}
                        >
                        </div>
                        
                        {/* Radiation Label */}
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap ml-2 bg-gray-100 px-2 py-1 rounded-full">
                          {item.rating || "N/A"}
                        </span>
                      </div>
                      
                      {/* Procedure Name */}
                      <span className="text-base font-semibold text-black/90 ml-1">
                        {item.procedure_name}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-gray-400 py-10 text-xl font-handwritten">
                  No procedures found.
                </div>
              )}
            </div>

            {/* X-Axis Label */}
            <div className="flex justify-between w-full text-sm font-handwritten mt-2 px-2 border-t border-black/20 pt-2 text-gray-500">
              <span>Low Radiation</span>
              <span>Medium Radiation</span>
              <span>High Radiation</span>
            </div>
          </div>

          {/* Legend & Controls */}
          <div className="w-1/3 flex flex-col gap-8 justify-center items-end pl-8">
            <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-6 rounded-2xl w-full">
              <h3 className="font-bold text-lg mb-2">Legend</h3>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#90EE90] rounded-md shadow-sm border border-green-200"></div>
                <span className="text-xl font-handwritten">USUALLY APPROPRIATE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFFFE0] rounded-md shadow-sm border border-yellow-200"></div>
                <span className="text-xl font-handwritten">MAY BE APPROPRIATE</span>
              </div>
              {showNotAppropriate && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#FFB6C1] rounded-md shadow-sm border border-red-200"></div>
                  <span className="text-xl font-handwritten">NOT APPROPRIATE</span>
                </div>
              )}
            </div>

            <button
              onClick={onToggleNotAppropriate}
              className={`w-full px-6 py-4 border-2 border-black text-black rounded-xl hover:bg-gray-100 transition-all font-handwritten text-xl font-bold uppercase tracking-wide ${showNotAppropriate ? 'bg-red-50' : 'bg-white'}`}
            >
              {showNotAppropriate ? 'Hide "Not Appropriate"' : 'Show "Not Appropriate"'}
            </button>

            <button
              onClick={onStartAgain}
              className="w-full px-6 py-4 bg-black text-white border-2 border-black rounded-xl hover:bg-gray-800 transition-all font-handwritten text-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Start Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}