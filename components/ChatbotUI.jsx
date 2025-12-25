"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "./screens/WelcomeScreen";
import PatientSelection from "./screens/PatientSelection";
import BodyAreaSelection from "./screens/BodyAreaSelection";
import Model3DView from "./screens/PanelAndCondition"; // Kept your import name
import ScenarioSelection from "./screens/ScenarioSelection";
import ResultsView from "./screens/ResultsView";

const ChatbotUI = () => {
  // UI State
  const [isStarted, setIsStarted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBodyArea, setShowBodyArea] = useState(false);
  const [show3D, setShow3D] = useState(false);
  
  // 3D Model State
  const [selectedModelSrc, setSelectedModelSrc] = useState(null);
  const [modelCentered, setModelCentered] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  // Selection State
  const [activeBodyArea, setActiveBodyArea] = useState(null);
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [showScenarioSelection, setShowScenarioSelection] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  // Data State
  const [masterData, setMasterData] = useState([]); 
  
  // Results State
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [allFetchedResults, setAllFetchedResults] = useState({ usually: [], maybe: [], rarely: [] });
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // --- 1. Helper Function: Age Boundary Logic ---
  const isAgeApplicable = (dbAgeString, patientType) => {
    if (!patientType || !dbAgeString) return true;
    
    // Normalize string (remove whitespace, handle potential formatting issues)
    const cleanStr = dbAgeString.toString().trim();
    
    // Split "10 - 60" or "0 - 18"
    const parts = cleanStr.split('-').map(s => parseInt(s.trim()));
    
    // If format is unexpected, default to include it to avoid hiding valid data
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return true;
    
    const [min, max] = parts;
    
    if (patientType === 'adult') {
      // Adult: Include if the range touches 18 or above (Max age >= 18)
      return max >= 18;
    } else {
      // Pediatric: Include if the range touches under 18 (Min age < 18)
      return min < 18;
    }
  };

  // --- 2. Computed Data: Age Filtered Master Data ---
  // This is the "Base" dataset for the current user session once they pick a patient type
  const ageFilteredData = useMemo(() => {
    if (!selectedPatient || masterData.length === 0) return [];
    return masterData.filter(item => isAgeApplicable(item.age, selectedPatient));
  }, [selectedPatient, masterData]);


  // --- 3. Fetch Master Data ONCE on Mount ---
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const res = await fetch('/api/conditions?type=master');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setMasterData(data.data);
          console.log("Master data loaded:", data.data);
        }
      } catch (error) {
        console.error("Failed to fetch master data", error);
      }
    };
    fetchMasterData();
  }, []);

  // --- 4. Logic: Filter Panels (Triggered by Body Area Selection) ---
  useEffect(() => {
    if (activeBodyArea && ageFilteredData.length > 0) {
      // Filter 3: Adult + Selected Body Area
      const relevantRows = ageFilteredData.filter(item => 
        item.body_area && item.body_area.toLowerCase() === activeBodyArea.toLowerCase()
      );

      // Extract Unique Panels
      const uniquePanels = [];
      const seenPanels = new Set();

      relevantRows.forEach(item => {
        if (item.panel && !seenPanels.has(item.panel)) {
          seenPanels.add(item.panel);
          uniquePanels.push(item); // Store full item to keep context if needed
        }
      });

      setPanels(uniquePanels);
      
      // Reset subsequent selections
      setSelectedPanel(null);
      setConditions([]);
      setSelectedCondition(null);
    }
  }, [activeBodyArea, ageFilteredData]);

  // --- 5. Logic: Filter Conditions (Triggered by Panel Selection) ---
  useEffect(() => {
    if (selectedPanel && ageFilteredData.length > 0) {
      // Filter 4: Adult + Body Area + Panel
      const relevantRows = ageFilteredData.filter(item => 
        (item.body_area && item.body_area.toLowerCase() === activeBodyArea.toLowerCase()) && 
        item.panel === selectedPanel
      );

      // Extract Unique Conditions (mapped from scenario_description)
      const uniqueConditions = [];
      const seenConditions = new Set();

      relevantRows.forEach(item => {
        const conditionLabel = item.scenario_description;
        // Basic cleanup and exclusion of placeholders
        if (conditionLabel && conditionLabel !== 'placeholder' && !seenConditions.has(conditionLabel)) {
          seenConditions.add(conditionLabel);
          uniqueConditions.push({
            label: conditionLabel,
            severity: 'normal' // Data doesn't have severity column, default to normal
          });
        }
      });

      setConditions(uniqueConditions);
      setSelectedCondition(null);
    }
  }, [selectedPanel, activeBodyArea, ageFilteredData]);

  // --- 3D Model Animation Effects ---
  useEffect(() => {
    if (!show3D) {
      setModelCentered(true);
      setHasMoved(false);
      setSelectedPanel(null);
      setSelectedCondition(null);
    } else {
      const timer = setTimeout(() => {
        setModelCentered(false);
        setHasMoved(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [show3D]);

  // --- Event Handlers ---

  const handleStart = () => setIsStarted(true);

  const handlePatientSelect = (type) => {
    // Step 1: User Selects Patient Type
    setSelectedPatient(type);
    setShowBodyArea(true);
    // Note: 'ageFilteredData' will automatically update via useMemo
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShow3D(false);
    setSelectedPanel(null);
    setSelectedCondition(null);
  };

  const handleBodyAreaSelect = (bodyArea, modelSrc) => {
    // Step 3: User Selects Body Area
    setSelectedModelSrc(modelSrc);
    setActiveBodyArea(bodyArea);
    setShow3D(true);
  };

  const handleBack3D = (e) => {
    e.stopPropagation();
    setShow3D(false);
    setActiveBodyArea(null);
    setSelectedPanel(null);
    setSelectedCondition(null);
    setPanels([]);
    setConditions([]);
  };

  const handleClose3D = (e) => {
    e.stopPropagation();
    setShow3D(false);
  };

  const handleUserInteract = (info) => {
    if (info && info.type === 'pointerup' && !hasMoved) {
      setIsMoving(true);
      setModelCentered(false);
      setHasMoved(true);
      setTimeout(() => setIsMoving(false), 900);
    }
  };

  const handlePanelSelect = (panel) => setSelectedPanel(panel); // Step 5

  const handleConditionSelect = (condition) => setSelectedCondition(condition); // Step 6

  // --- 6. Logic: Filter Scenarios (Triggered by Next Button) ---
  const handleNext = () => {
    if (selectedCondition && ageFilteredData.length > 0) {
      // Filter 5: Adult + Body Area + Panel + Condition
      const relevantRows = ageFilteredData.filter(item => 
        (item.body_area && item.body_area.toLowerCase() === activeBodyArea.toLowerCase()) && 
        item.panel === selectedPanel &&
        item.scenario_description === selectedCondition
      );

      // Map unique scenarios (using variant description)
      const uniqueScenarios = relevantRows.map(item => ({
        scenario_id: item.variant?.id || item.scenario_id, 
        scenario: item.variant?.description || "Default Scenario",
        fullObject: item // Pass full object to avoid re-finding it later
      }));

      setScenarios(uniqueScenarios);
      setShowScenarioSelection(true);
    }
  };

  // --- 7. Logic: Display Results (Triggered by Scenario Selection) ---
  const handleScenarioSelect = (scenarioObj) => {
    setSelectedScenario(scenarioObj);
    
    // Extract procedures from the selected object
    // Assuming structure: { procedures: [ { procedure_name, appropriateness_category, ... } ] }
    const procedures = scenarioObj.fullObject?.procedures || [];

    if (procedures.length > 0) {
      const processed = procedures.map(proc => {
        let app = 'unknown';
        const cat = proc.appropriateness_category ? proc.appropriateness_category.toLowerCase() : '';
        
        if (cat.includes('usually not')) app = 'rarely';
        else if (cat.includes('usually appropriate')) app = 'usually';
        else if (cat.includes('may be')) app = 'maybe';

        return {
          procedure_name: proc.procedure_name,
          rating: proc.adult_rrl || proc.peds_rrl || '', // Use adult or peds RRL
          appropriate: app,
          original_category: proc.appropriateness_category
        };
      });

      const usually = processed.filter(i => i.appropriate === 'usually');
      const maybe = processed.filter(i => i.appropriate === 'maybe');
      const rarely = processed.filter(i => i.appropriate === 'rarely' || i.appropriate === 'unknown');

      setAllFetchedResults({ usually, maybe, rarely });
      setResults([...usually, ...maybe]);
      setShowNotAppropriate(false);
      setShowResults(true);
    } else {
      // Handle empty results gracefully
      setResults([]);
      setShowResults(true);
    }
  };

  const handleBackFromScenario = () => {
    setShowScenarioSelection(false);
    setScenarios([]);
  };

  const handleBackFromResults = () => {
    setShowResults(false);
    setSelectedScenario(null);
    setResults([]);
    setShowNotAppropriate(false);
  };

  const handleToggleNotAppropriate = () => {
    if (showNotAppropriate) {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe]);
    } else {
      setResults([...allFetchedResults.usually, ...allFetchedResults.maybe, ...allFetchedResults.rarely]);
    }
    setShowNotAppropriate(!showNotAppropriate);
  };

  const handleStartAgain = () => {
    setIsStarted(false);
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShow3D(false);
    setActiveBodyArea(null);
    setPanels([]);
    setSelectedPanel(null);
    setConditions([]);
    setSelectedCondition(null);
    setScenarios([]);
    setShowScenarioSelection(false);
    setShowResults(false);
    setSelectedScenario(null);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-black">
      {!isStarted ? (
        <WelcomeScreen onStart={handleStart} />
      ) : (
        <div className="bg-white h-screen w-screen flex items-center justify-center overflow-hidden relative">
          <div className="relative w-full max-w-[1400px] h-full flex flex-col items-center justify-center">
            {showResults ? (
              <ResultsView
                results={results}
                showNotAppropriate={showNotAppropriate}
                onBack={handleBackFromResults}
                onToggleNotAppropriate={handleToggleNotAppropriate}
                onStartAgain={handleStartAgain}
              />
            ) : showScenarioSelection ? (
              <ScenarioSelection
                scenarios={scenarios}
                selectedModelSrc={selectedModelSrc}
                onBack={handleBackFromScenario}
                onScenarioSelect={handleScenarioSelect}
              />
            ) : !showBodyArea ? (
              <PatientSelection
                selectedPatient={selectedPatient}
                onPatientSelect={handlePatientSelect}
                onBack={() => setIsStarted(false)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col animate-[fadeIn_0.5s_ease-in-out] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {!show3D && (
                  <BodyAreaSelection
                    selectedPatient={selectedPatient}
                    masterData={ageFilteredData} /* Pass the filtered data here */
                    onBack={handleBack}
                    onBodyAreaSelect={handleBodyAreaSelect}
                  />
                )}

                <AnimatePresence>
                  {show3D && (
                    <Model3DView
                      selectedModelSrc={selectedModelSrc}
                      modelCentered={modelCentered}
                      hasMoved={hasMoved}
                      panels={panels}
                      conditions={conditions}
                      activeBodyArea={activeBodyArea}
                      selectedPanel={selectedPanel}
                      selectedCondition={selectedCondition}
                      onBack={handleBack3D}
                      onClose={handleClose3D}
                      onUserInteract={handleUserInteract}
                      onPanelSelect={handlePanelSelect}
                      onConditionSelect={handleConditionSelect}
                      onNext={handleNext}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotUI;