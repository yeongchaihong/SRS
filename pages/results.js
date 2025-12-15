import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useChatbot } from './Context/ChatbotContext';
import { motion } from "framer-motion";

export default function ResultsPage() {
  const router = useRouter();
  const { results, allFetchedResults, setResults, resetAll } = useChatbot();
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // Safety: Redirect to home if no data exists
  useEffect(() => {
    if (!results || results.length === 0) {
      // router.push('/'); 
    }
  }, [results, router]);

  const handleStartAgain = () => {
    resetAll();
    router.push('/');
  };

  const handleToggleNotAppropriate = () => {
    if (showNotAppropriate) {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe]);
    } else {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe, ...allFetchedResults.rarely]);
    }
    setShowNotAppropriate(!showNotAppropriate);
  };

  // --- SCORE CALCULATION ---
  const calculateScore = (item) => {
    if (typeof item.score === 'number') return item.score;
    const rrl = item.radiationString || "";
    if (rrl.includes('☢')) return (rrl.match(/☢/g) || []).length * 3;
    if (rrl.includes('O')) return 0;
    return 1;
  };

  const getBarColor = (type) => {
    if (type === 'usually') return '#90EE90'; 
    if (type === 'maybe') return '#FFFFE0';   
    return '#FFB6C1';                         
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-screen w-full p-8 bg-white text-black overflow-hidden relative"
    >
      <button 
        onClick={() => router.back()} 
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-20"
      >
        &lt; Back
      </button>

      <div className="flex flex-col items-center w-full h-full mt-4">
        <h2 className="text-5xl mb-8 tracking-wider">RECOMMEND PROCEDURE</h2>

        <div className="w-full flex flex-row gap-12 h-full px-12 pb-12 overflow-hidden">
          
          {/* --- LEFT: GRAPH AREA --- */}
          {/* Added 'overflow-visible' to ensure the negative margin labels show up */}
          <div className="flex-1 flex flex-col relative border-l-2 border-b-2 border-black/50 pl-4 pb-2 pt-2 ml-8 overflow-visible">
            
            {/* FIX 1: Y-Axis Label Centered */}
            {/* Changed from top-0 to top-1/2 with translate to center it perfectly */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-sm -rotate-90 text-center">
              appropriate level
            </div>

            {/* FIX 2: Scrollable Container Logic */}
            {/* changed h-full to 'flex-1 min-h-0' so it shrinks to fit the screen, keeping footer visible */}
            <div className="flex-1 flex flex-col gap-6 w-full overflow-y-auto pr-4 custom-scrollbar min-h-0">
              {results.map((item, index) => {
                const score = calculateScore(item);
                const widthPercent = Math.min(Math.max((score / 12) * 100, 2), 100);

                return (
                  <div key={index} className="flex flex-col gap-1 w-full shrink-0">
                    <div className="flex items-center gap-2 w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="h-8 rounded-r-md shadow-sm border border-black/10"
                        style={{ backgroundColor: getBarColor(item.appropriate) }}
                      />
                      <span className="text-sm font-medium text-black/80 ml-2 whitespace-nowrap">
                        {item.radiationString || "N/A"}
                      </span>
                    </div>
                    <span className="text-sm text-black/90 font-medium">
                      {item.name}
                    </span>
                  </div>
                );
              })}
              
              {results.length === 0 && (
                 <div className="text-gray-400 text-xl text-center mt-10">
                    No results found...
                 </div>
              )}
            </div>

            {/* FIX 3: X-Axis Labels Pinned to Bottom */}
            {/* This sits OUTSIDE the scrollable div, inside the flex column, so it's always visible */}
            <div className="flex justify-between w-full text-sm mt-2 px-2 border-t border-black/20 pt-2 shrink-0">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10+</span>
              <span className="text-xs self-end mb-1 font-sans text-gray-500">radiation lvl</span>
            </div>
          </div>

          {/* --- RIGHT: LEGEND & CONTROLS --- */}
          <div className="w-1/3 flex flex-col gap-8 justify-center items-end pl-8">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#90EE90] rounded-sm border border-black/20 shadow-sm"></div>
                <span className="text-xl font-handwritten">USUALLY APPROPRIATE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFFFE0] rounded-sm border border-black/20 shadow-sm"></div>
                <span className="text-xl font-handwritten">MAYBE APPROPRIATE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFB6C1] rounded-sm border border-black/20 shadow-sm"></div>
                <span className="text-xl font-handwritten">NOT APPROPRIATE</span>
              </div>
            </div>

            <button
              onClick={handleToggleNotAppropriate}
              className="px-6 py-3 border-2 border-black text-black rounded-full transition-all font-handwritten text-xl hover:bg-gray-100 w-full"
            >
              {showNotAppropriate ? 'HIDE NOT AP CHOICES' : 'SHOW NOT AP CHOICES'}
            </button>

            <button
              onClick={handleStartAgain}
              className="px-6 py-3 border-2 border-black text-black rounded-full hover:bg-red-500/10 transition-colors font-handwritten text-xl w-full"
            >
              START AGAIN
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}