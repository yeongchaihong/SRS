export default function ResultsView({ 
  results, 
  showNotAppropriate,
  onBack, 
  onToggleNotAppropriate, 
  onStartAgain 
}) {
  return (
    <div className="absolute inset-0 flex flex-col p-8 animate-[fadeIn_0.5s_ease-in-out] text-black">
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="flex flex-col items-center w-full h-full mt-4">
        <h2 className="text-5xl font-handwritten mb-12 tracking-wider">RECOMMEND PROCEDURE</h2>

        <div className="w-full flex flex-row gap-12 h-full px-12">
          <div className="flex-1 flex flex-col relative border-l-2 border-b-2 border-black/50 p-4">
            <div className="absolute -left-32 top-0 text-sm -rotate-90 origin-right">appropriate lvl</div>
            <div className="flex flex-col gap-6 w-full mt-auto mb-8 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
              {results.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-8 rounded-r-md transition-all duration-1000 ease-out ${
                        item.appropriate === 'usually' ? 'bg-[#90EE90]' :
                        item.appropriate === 'maybe' ? 'bg-[#FFFFE0]' :
                        'bg-[#FFB6C1]'
                      }`}
                      style={{ width: `${Math.max((item.score / 10) * 100, 1)}%` }}
                    ></div>
                    <span className="text-sm font-medium text-black/80 ml-2">
                      {item.radiationString || item.score}
                    </span>
                  </div>
                  <span className="text-sm text-black/90">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between w-full text-sm font-handwritten mt-2 px-2">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
              <span className="text-xs self-end mb-1">radiation lvl</span>
            </div>
          </div>

          <div className="w-1/3 flex flex-col gap-8 justify-center items-end">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-[#90EE90] rounded-sm"></div>
                <span className="text-xl font-handwritten">USUALLY AP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-[#FFFFE0] rounded-sm"></div>
                <span className="text-xl font-handwritten">MAYBE AP</span>
              </div>
            </div>

            <button
              onClick={onToggleNotAppropriate}
              className={`px-6 py-3 border-2 border-black text-black rounded-full hover:bg-red-500/10 transition-colors font-handwritten text-xl`}
            >
              {showNotAppropriate ? 'HIDE NOT AP CHOICES' : 'SHOW NOT AP CHOICES'}
            </button>

            <button
              onClick={onStartAgain}
              className="px-6 py-3 border-2 border-black text-black rounded-full hover:bg-red-500/10 transition-colors font-handwritten text-xl"
            >
              START AGAIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
