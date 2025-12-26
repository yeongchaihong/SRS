"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "./screens/WelcomeScreen";
import PatientSelection from "./screens/PatientSelection";
import BodyAreaSelection from "./screens/BodyAreaSelection";
import Model3DView from "./screens/PanelAndCondition"; 
import ScenarioSelection from "./screens/ScenarioSelection";
import ResultsView from "./screens/ResultsView";

const ChatbotUI = () => {
  // UI State
  const [isStarted, setIsStarted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBodyArea, setShowBodyArea] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
    if (!dbAgeString) return true;
    if (!patientType) return true;

    try {
      const cleanStr = String(dbAgeString).trim();
      const parts = cleanStr.split('-').map(s => parseInt(s.trim()));
      
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return true; 
      
      const [min, max] = parts;
      
      if (patientType === 'adult') {
        return max >= 18;
      } else {
        return min < 18;
      }
    } catch (e) {
      return true;
    }
  };

  // --- 2. Computed Data: Age Filtered Master Data ---
  const ageFilteredData = useMemo(() => {
    if (!selectedPatient || masterData.length === 0) return [];
    
    return masterData.filter(item => {
        const ageVal = item["Age"] || item.age; 
        return isAgeApplicable(ageVal, selectedPatient);
    });
  }, [selectedPatient, masterData]);


  // --- 3. Fetch Master Data ONCE on Mount ---
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/conditions');
        if (!res.ok) throw new Error("API Failed");
        const data = await res.json();
        if (data.success) {
          setMasterData(data.data);
          console.log("Master data loaded, count:", data.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch master data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterData();
  }, []);

  // --- 4. Logic: Filter Panels ---
  useEffect(() => {
    if (activeBodyArea && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = item["Body Area"] || item.body_area;
        return area && area.toLowerCase() === activeBodyArea.toLowerCase();
      });

      const uniquePanels = [];
      const seenPanels = new Set();
      relevantRows.forEach(item => {
        if (item.panel && !seenPanels.has(item.panel)) {
          seenPanels.add(item.panel);
          uniquePanels.push(item);
        }
      });
      setPanels(uniquePanels);
      setSelectedPanel(null);
      setConditions([]);
      setSelectedCondition(null);
    }
  }, [activeBodyArea, ageFilteredData]);

  // --- 5. Logic: Filter Conditions ---
  useEffect(() => {
    if (selectedPanel && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = item["Body Area"] || item.body_area;
        return (area && area.toLowerCase() === activeBodyArea.toLowerCase()) && item.panel === selectedPanel;
      });

      const uniqueConditions = [];
      const seenConditions = new Set();
      relevantRows.forEach(item => {
        const conditionLabel = item.condition; 
        if (conditionLabel && !seenConditions.has(conditionLabel)) {
          seenConditions.add(conditionLabel);
          uniqueConditions.push({ label: conditionLabel, severity: 'normal' });
        }
      });
      setConditions(uniqueConditions);
      setSelectedCondition(null);
    }
  }, [selectedPanel, activeBodyArea, ageFilteredData]);

  // --- 3D Model Animation ---
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

  // --- Handlers ---
  const handleStart = () => setIsStarted(true);
  
  const handlePatientSelect = (type) => {
    setSelectedPatient(type);
    setShowBodyArea(true);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShow3D(false);
    setSelectedPanel(null);
    setSelectedCondition(null);
  };

  const handleBodyAreaSelect = (bodyArea, modelSrc) => {
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

  const handlePanelSelect = (panel) => setSelectedPanel(panel);
  const handleConditionSelect = (condition) => setSelectedCondition(condition);

  const handleNext = () => {
    if (selectedCondition && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = item["Body Area"] || item.body_area;
        return (area && area.toLowerCase() === activeBodyArea.toLowerCase()) && 
        item.panel === selectedPanel &&
        item.condition === selectedCondition;
      });

      const uniqueScenarios = relevantRows.map(item => ({
        scenario_id: item.scenario_id, 
        scenario: item.scenario_description || "Default Scenario",
        fullObject: item 
      }));

      setScenarios(uniqueScenarios);
      setShowScenarioSelection(true);
    }
  };

  const handleScenarioSelect = (scenarioObj) => {
    setSelectedScenario(scenarioObj);
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
          rating: proc.adult_rrl || proc.peds_rrl || '', 
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
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-black bg-white">
      {!isStarted ? (
        <WelcomeScreen onStart={handleStart} />
      ) : isLoading ? (
        <div className="bg-white h-[100dvh] w-full flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white h-[100dvh] w-full flex items-center justify-center overflow-hidden relative">
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
              <div className="absolute inset-0 flex flex-col animate-[fadeIn_0.5s_ease-in-out] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:16px_16px]">
                {!show3D && (
                  <BodyAreaSelection
                    selectedPatient={selectedPatient}
                    masterData={ageFilteredData}
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