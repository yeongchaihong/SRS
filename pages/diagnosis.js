import { useMemo, useState } from 'react'; // Added useMemo
import { useRouter } from 'next/router';
import { useChatbot } from './Context/ChatbotContext'; // Adjusted import path
import ModelViewer from "@/components/ui/model-viewer";
import TypingSelection from "@/components/ui/typing-selection";
import { motion } from "framer-motion";

export default function DiagnosisPage() {
  const router = useRouter();
  const { 
    selectedPatient, 
    activeBodyArea, 
    selectedModelSrc,
    selectedPanel, 
    setSelectedPanel,
    selectedCondition, 
    setSelectedCondition,
    masterData, // Get the loaded data from context
    setScenarios, // Assuming this is still in context
    isAgeApplicable
  } = useChatbot();

  // Local state for animation logic
  const [modelCentered, setModelCentered] = useState(false);
  const [hasMoved, setHasMoved] = useState(true); 

  // --- REPLACED API LOGIC WITH FILTERING LOGIC ---

  // 1. Filter Panels based on selectedPatient + activeBodyArea
  const currentPanels = useMemo(() => {
    if (!masterData || masterData.length === 0) return [];
    console.log("Master Data in Diagnosis:", masterData);
    const filtered = masterData.filter(item => {
      const dbArea = item["body_area"]?.toLowerCase(); 
      const selectedArea = activeBodyArea?.toLowerCase();
      
      // Much cleaner!
      return dbArea === selectedArea && isAgeApplicable(item.age);
    });

    // console.log("Filtered Panels:", filtered);
    // console.log("Active Body Area:", activeBodyArea);
    // console.log("Selected Patient Type:", selectedPatient);

    const uniquePanels = [...new Set(filtered.map(item => item.panel))];
    return uniquePanels.filter(p => p).sort(); 
  }, [masterData, selectedPatient, activeBodyArea]);


  // 2. Filter Conditions based on selectedPanel
  const currentConditions = useMemo(() => {
    if (!selectedPanel || !masterData) return [];

    const filtered = masterData.filter(item => {
      // 1. Match Body Area (Case insensitive)
      // checks both "Body Area" (raw JSON) and "body_area" (normalized) just in case
      const dbArea = (item["Body Area"] || item.body_area)?.toLowerCase();
      const selectedArea = activeBodyArea?.toLowerCase();
      
      if (dbArea !== selectedArea) return false;

      // 2. FIX: Check Age using the helper function
      // Passes the raw "Age" string (e.g., "18 - 150") to the helper
      if (!isAgeApplicable(item.Age || item.age)) return false;

      // 3. Match Panel
      return item.panel === selectedPanel;
    });

    // 4. Get Unique Conditions (Remove duplicates)
    const uniqueConditions = [...new Set(filtered.map(item => item.condition))];

    return uniqueConditions
      .filter(c => c && c !== 'placeholder') // Filter empty/placeholder
      .sort() // Sort alphabetically
      .map(c => ({ label: c })); // Format for dropdown
      
  }, [masterData, activeBodyArea, selectedPanel, isAgeApplicable]);


  // --- KEEP SCENARIO FETCHING (Assuming this is still complex/dynamic) ---
  // If scenarios are also in masterData, you can replace this with filtering too.
  // const handleNext = async () => {
  //   const res = await fetch(`/api/conditions?type=scenarios&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}&condition=${encodeURIComponent(selectedCondition)}`);
  //   const data = await res.json();
  //   if (data.success) {
  //     setScenarios(data.data);
  //     router.push('/scenarios');
  //   }
  // };

  const handleNext = () => {
    router.push('/scenarios');
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-screen w-full relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-white overflow-hidden"
    >
      <button onClick={() => router.back()} className="absolute top-4 left-4 z-50 text-black font-semibold bg-white/90 rounded-full px-4 py-2 shadow-md hover:scale-105 transition-transform">
        &lt; Back
      </button>

      {/* 3D Model Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          animate={{ x: '-30%', scale: 0.95 }} 
          transition={{ duration: 0.8 }}
          className="w-3/5 h-4/5"
        >
          {selectedModelSrc && (
            <ModelViewer src={selectedModelSrc} cameraControls={true} />
          )}
        </motion.div>
      </div>

      {/* Right Side Panel Selection */}
      <div className="absolute top-1/2 transform -translate-y-1/2 right-4 w-96 z-50 flex flex-col gap-4">
        
        {/* PANEL SELECTION */}
        <TypingSelection
          key={activeBodyArea} 
          text="Choose the panel"
          // Use the filtered currentPanels here
          options={currentPanels.map(p => ({ label: p }))}
          showHeader={true}
          onSelect={(opt) => setSelectedPanel(typeof opt === 'string' ? opt : opt.label)}
          className="premium-glass-panel"
        />

        {/* CONDITION SELECTION */}
        {selectedPanel && (
           <TypingSelection
             key={selectedPanel} 
             text="Choose the condition"
             // Use the filtered currentConditions here
             options={currentConditions}
             showHeader={true}
             onSelect={(opt) => setSelectedCondition(typeof opt === 'string' ? opt : opt.label)}
             className="premium-glass-panel mt-4"
           />
        )}

        {selectedCondition && (
          <button 
            onClick={handleNext}
            className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Next
          </button>
        )}
      </div>
    </motion.div>
  );
}