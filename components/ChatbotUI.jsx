"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "./screens/WelcomeScreen";
import PatientSelection from "./screens/PatientSelection";
import BodyAreaSelection from "./screens/BodyAreaSelection";
import PanelAndCondition from "./screens/PanelAndCondition";
import ScenarioSelection from "./screens/ScenarioSelection";
import ResultsView from "./screens/ResultsView";
import Sidebar from "./ui/Sidebar";
import GlobalBackButton from "./ui/GlobalBackButton";

const ChatbotUI = () => {
  // --- UI State ---
  const [isStarted, setIsStarted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBodyArea, setShowBodyArea] = useState(false);
  const [showPanelAndCondition, setShowPanelAndCondition] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- 3D Model State ---
  const [selectedModelSrc, setSelectedModelSrc] = useState(null);
  const [multiModelIndex, setMultiModelIndex] = useState(0);
  const [modelCentered, setModelCentered] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  // --- Selection State ---
  const [activeBodyArea, setActiveBodyArea] = useState(null);
  const [activeBodyAreas, setActiveBodyAreas] = useState([]);
  const [panels, setPanels] = useState([]);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [showScenarioSelection, setShowScenarioSelection] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  // --- Data & Results State ---
  const [masterData, setMasterData] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [allFetchedResults, setAllFetchedResults] = useState({ usually: [], maybe: [], rarely: [] });
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // --- Sidebar & Favorites State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // --- Helpers & Effects ---
  const isAgeApplicable = (dbAgeString, patientType) => {
    if (!dbAgeString) return true;
    if (!patientType) return true;
    try {
      const cleanStr = String(dbAgeString).trim();
      const parts = cleanStr.split('-').map(s => parseInt(s.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return true;
      const [min, max] = parts;
      return patientType === 'adult' ? max >= 18 : min < 18;
    } catch (e) { return true; }
  };

  const ageFilteredData = useMemo(() => {
    if (!selectedPatient || masterData.length === 0) return [];
    return masterData.filter(item => isAgeApplicable(item["Age"] || item.age, selectedPatient));
  }, [selectedPatient, masterData]);

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

  // Derive the effective list of body areas to filter by
  const effectiveBodyAreas = activeBodyAreas.length > 0
    ? activeBodyAreas.map(a => (typeof a === 'string' ? a : a.name).toLowerCase())
    : activeBodyArea ? [activeBodyArea.toLowerCase()] : [];

  const multiModelSequence = useMemo(() => {
    const seen = new Set();
    return activeBodyAreas
      .flatMap((area) => {
        if (typeof area === "string") return [];
        if (Array.isArray(area?.linkedAreas) && area.linkedAreas.length > 0) {
          return area.linkedAreas
            .map((linked) => {
              if (!linked?.model) return null;
              return {
                name: linked?.name || "Model",
                model: linked.model,
              };
            })
            .filter(Boolean);
        }
        if (!area?.model) return [];
        return [{ name: area?.name || "Model", model: area.model }];
      })
      .filter((entry) => {
        if (!entry || seen.has(entry.model)) return false;
        seen.add(entry.model);
        return true;
      });
  }, [activeBodyAreas]);

  const multiModelSources = useMemo(
    () => multiModelSequence.map((entry) => entry.model),
    [multiModelSequence]
  );

  const currentModelLabel =
    multiModelSequence[multiModelIndex]?.name || null;

  const setMultiModelByIndex = useCallback((index) => {
    if (multiModelSources.length === 0) return;
    const total = multiModelSources.length;
    const normalizedIndex = ((index % total) + total) % total;
    setMultiModelIndex(normalizedIndex);
    setSelectedModelSrc(multiModelSources[normalizedIndex]);
  }, [multiModelSources]);

  useEffect(() => {
    if (effectiveBodyAreas.length > 0 && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = (item["Body Area"] || item.body_area || "").toLowerCase();
        return effectiveBodyAreas.includes(area);
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
  }, [activeBodyArea, activeBodyAreas, ageFilteredData]);

  // IMPORTANT FIX: Removed setSelectedCondition(null) from here to prevent wiping state on history restore
  useEffect(() => {
    if (selectedPanel && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = (item["Body Area"] || item.body_area || "").toLowerCase();
        return effectiveBodyAreas.includes(area) && item.panel === selectedPanel;
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
      // setSelectedCondition(null); // <--- REMOVED THIS LINE
    }
  }, [selectedPanel, activeBodyArea, activeBodyAreas, ageFilteredData]);

  useEffect(() => {
    if (!showPanelAndCondition) {
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
  }, [showPanelAndCondition]);

  useEffect(() => {
    if (multiModelSources.length === 0) {
      setMultiModelIndex(0);
      return;
    }

    if (multiModelSources.length === 1) {
      setMultiModelIndex(0);
      setSelectedModelSrc(multiModelSources[0]);
      return;
    }

    if (multiModelIndex >= multiModelSources.length) {
      setMultiModelByIndex(0);
    }
  }, [multiModelSources, multiModelIndex, setMultiModelByIndex]);

  useEffect(() => {
    if (!showPanelAndCondition || multiModelSources.length <= 1) return;

    const rotationTimer = setTimeout(() => {
      setMultiModelByIndex(multiModelIndex + 1);
    }, 10000);

    return () => clearTimeout(rotationTimer);
  }, [showPanelAndCondition, multiModelSources, multiModelIndex, setMultiModelByIndex]);

  // Check Favorites Status
  useEffect(() => {
    if (selectedScenario) {
      const favorites = JSON.parse(localStorage.getItem("favorite_referrals") || "[]");
      const exists = favorites.some(f => f.scenario.scenario_id === selectedScenario.scenario_id);
      setIsFavorite(exists);
    }
  }, [selectedScenario]);

  // --- Handlers ---
  const handleStart = () => setIsStarted(true);

  const handlePatientSelect = (type) => {
    setSelectedPatient(type);
    setShowBodyArea(true);
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setShowBodyArea(false);
    setShowPanelAndCondition(false);
    setSelectedPanel(null);
    setSelectedCondition(null);
  };

  const handleBodyAreaSelect = (bodyArea, modelSrc, linkedAreas = []) => {
    setSelectedModelSrc(modelSrc);
    setMultiModelIndex(0);
    setActiveBodyArea(bodyArea);
    setActiveBodyAreas(linkedAreas.length > 1 ? linkedAreas : []);
    setShowPanelAndCondition(true);
  };

  const handleMultiBodyAreaSelect = (areas) => {
    // areas is an array of { name, model } objects
    setActiveBodyAreas(areas);
    setMultiModelIndex(0);
    setActiveBodyArea(areas[0]?.name || null);
    setSelectedModelSrc(areas[0]?.model || null);
    setShowPanelAndCondition(true);
  };

  const handlePrevModel = () => {
    setMultiModelByIndex(multiModelIndex - 1);
  };

  const handleNextModel = () => {
    setMultiModelByIndex(multiModelIndex + 1);
  };

  const handleBack3D = (e) => {
    e.stopPropagation();
    setShowPanelAndCondition(false);
    setMultiModelIndex(0);
    setActiveBodyArea(null);
    setActiveBodyAreas([]);
    setSelectedPanel(null);
    setSelectedCondition(null);
    setPanels([]);
    setConditions([]);
  };

  const handleClose3D = (e) => {
    e.stopPropagation();
    setShowPanelAndCondition(false);
  };

  const handleUserInteract = (info) => {
    if (info && info.type === 'pointerup' && !hasMoved) {
      setIsMoving(true);
      setModelCentered(false);
      setHasMoved(true);
      setTimeout(() => setIsMoving(false), 900);
    }
  };

  // IMPORTANT FIX: Reset condition here on manual panel change
  const handlePanelSelect = (panel) => {
    setSelectedPanel(panel);
    setSelectedCondition(null);
  };

  const handleConditionSelect = (condition) => setSelectedCondition(condition);

  const handleNext = () => {
    if (selectedCondition && ageFilteredData.length > 0) {
      const relevantRows = ageFilteredData.filter(item => {
        const area = (item["Body Area"] || item.body_area || "").toLowerCase();
        return effectiveBodyAreas.includes(area) &&
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

  // --- ROBUST HISTORY SAVING ---
  const handleScenarioSelect = (scenarioObj) => {
    setSelectedScenario(scenarioObj);

    // 1. Process Procedures
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

    // 2. Save to History (Robust Condition Extraction)
    const reliableCondition =
      scenarioObj.fullObject?.condition ||
      scenarioObj.fullObject?.Condition ||
      selectedCondition ||
      scenarioObj.fullObject?.panel ||
      "General Referral";

    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      patientType: selectedPatient,
      bodyArea: activeBodyArea,
      panel: selectedPanel,
      condition: reliableCondition, // Ensures title is saved correctly
      scenario: scenarioObj,
    };

    const existingHistory = JSON.parse(localStorage.getItem("recent_referrals") || "[]");
    // Avoid duplicates
    const filteredHistory = existingHistory.filter(h => h.scenario.scenario_id !== scenarioObj.scenario_id);
    const updatedHistory = [historyItem, ...filteredHistory].slice(0, 15);

    localStorage.setItem("recent_referrals", JSON.stringify(updatedHistory));
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
    setShowPanelAndCondition(false);
    setMultiModelIndex(0);
    setActiveBodyArea(null);
    setActiveBodyAreas([]);
    setPanels([]);
    setSelectedPanel(null);
    setConditions([]);
    setSelectedCondition(null);
    setScenarios([]);
    setShowScenarioSelection(false);
    setShowResults(false);
    setSelectedScenario(null);
  };

  const handleSelectFromHistory = (historyItem) => {
    // 1. Restore State
    setSelectedPatient(historyItem.patientType);
    setActiveBodyArea(historyItem.bodyArea);
    setSelectedPanel(historyItem.panel);
    // CRITICAL: Restore condition so Favorites work
    setSelectedCondition(historyItem.condition);
    setSelectedScenario(historyItem.scenario);

    // 2. Re-process Procedures
    const procedures = historyItem.scenario.fullObject?.procedures || [];
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

    setIsStarted(true);
    setIsSidebarOpen(false);
  };

  // --- ROBUST FAVORITES SAVING ---
  const handleToggleFavorite = () => {
    if (!selectedScenario) return;

    const favorites = JSON.parse(localStorage.getItem("favorite_referrals") || "[]");
    const exists = favorites.some(f => f.scenario.scenario_id === selectedScenario.scenario_id);

    if (exists) {
      // Remove it
      const newFavorites = favorites.filter(f => f.scenario.scenario_id !== selectedScenario.scenario_id);
      localStorage.setItem("favorite_referrals", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      // Add it - Robust Logic
      const reliableCondition =
        selectedCondition ||
        selectedScenario.fullObject?.condition ||
        selectedScenario.fullObject?.Condition ||
        selectedScenario.fullObject?.panel ||
        "General Referral";

      const newFav = {
        id: Date.now(),
        patientType: selectedPatient,
        bodyArea: activeBodyArea,
        panel: selectedPanel,
        condition: reliableCondition, // <--- Using robust variable
        scenario: selectedScenario
      };

      console.log("Adding to favorites:", newFav);
      localStorage.setItem("favorite_referrals", JSON.stringify([newFav, ...favorites]));
      setIsFavorite(true);
    }
  };

  const handleGlobalBack = () => {
    if (showResults) return handleBackFromResults();
    if (showScenarioSelection) return handleBackFromScenario();
    if (showPanelAndCondition) return handleBack3D({ stopPropagation: () => { } });
    if (showBodyArea) return handleBack();
    if (isStarted && !showBodyArea) {
      setIsStarted(false);
      setSelectedPatient(null);
      return;
    }
  };

  // --- VIEW LOGIC ---
  const renderActiveView = () => {
    switch (true) {
      case showResults:
        return (
          <ResultsView
            results={results}
            scenario={selectedScenario}
            showNotAppropriate={showNotAppropriate}
            onBack={handleBackFromResults}
            onToggleNotAppropriate={handleToggleNotAppropriate}
            onStartAgain={handleStartAgain}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case showScenarioSelection:
        return (
          <ScenarioSelection
            scenarios={scenarios}
            selectedModelSrc={selectedModelSrc}
            onBack={handleBackFromScenario}
            onScenarioSelect={handleScenarioSelect}
          />
        );

      case !showBodyArea:
        return (
          <PatientSelection
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            onBack={() => setIsStarted(false)}
          />
        );

      default:
        return (
          <div className="absolute inset-0 flex flex-col animate-[fadeIn_0.5s_ease-in-out] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:16px_16px]">
            {!showPanelAndCondition && (
              <BodyAreaSelection
                selectedPatient={selectedPatient}
                masterData={ageFilteredData}
                onBack={handleBack}
                onBodyAreaSelect={handleBodyAreaSelect}
                onMultiBodyAreaSelect={handleMultiBodyAreaSelect}
              />
            )}

            <AnimatePresence>
              {showPanelAndCondition && (
                <PanelAndCondition
                  selectedModelSrc={selectedModelSrc}
                  modelCentered={modelCentered}
                  hasMoved={hasMoved}
                  currentModelIndex={multiModelIndex}
                  totalModels={multiModelSources.length}
                  currentModelLabel={currentModelLabel}
                  panels={panels}
                  conditions={conditions}
                  activeBodyArea={activeBodyArea}
                  activeBodyAreas={activeBodyAreas}
                  selectedPanel={selectedPanel}
                  selectedCondition={selectedCondition}
                  onBack={handleBack3D}
                  onClose={handleClose3D}
                  onUserInteract={handleUserInteract}
                  onPrevModel={handlePrevModel}
                  onNextModel={handleNextModel}
                  onPanelSelect={handlePanelSelect}
                  onConditionSelect={handleConditionSelect}
                  onNext={handleNext}
                />
              )}
            </AnimatePresence>
          </div>
        );
    }
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen w-full relative overflow-hidden font-sans text-black bg-white">

      {isStarted && !isLoading && (
        <div className="fixed top-8 left-4 md:top-6 md:left-6 z-[100] flex flex-row gap-3 md:gap-4 items-center md:items-start">

          {/* Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white/90 backdrop-blur-md border border-slate-200 p-2.5 md:p-3 rounded-full shadow-lg hover:scale-110 transition-all text-slate-600 active:scale-95 shrink-0"
            aria-label="Open History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Global Back Button */}
          <button
            onClick={handleGlobalBack}
            className="hidden md:flex py-1.5 px-3 md:py-2 md:px-2 md:mt-0.5 rounded-xl hover:scale-105 transition-all text-black font-semibold text-base md:text-lg active:scale-95 shrink-0"
          >
            &lt; Back
          </button>
        </div>
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectHistory={handleSelectFromHistory}
      />

      {!isStarted ? (
        <WelcomeScreen onStart={handleStart} />
      ) : isLoading ? (
        <div className="bg-white h-[100dvh] w-full flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white h-[100dvh] w-full flex items-center justify-center overflow-hidden relative">
          <div className="relative w-full max-w-[1920px] h-full flex flex-col items-center justify-center">
            {renderActiveView()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotUI;