"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "./screens/WelcomeScreen";
import PatientSelection from "./screens/PatientSelection";
import BodyAreaSelection from "./screens/BodyAreaSelection";
import Model3DView from "./screens/Model3DView";
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
  
  // Results State
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [allFetchedResults, setAllFetchedResults] = useState({ usually: [], maybe: [], rarely: [] });
  const [showNotAppropriate, setShowNotAppropriate] = useState(false);

  // Fetch Panels when Body Area is selected
  useEffect(() => {
    if (selectedPatient && activeBodyArea) {
      const fetchPanels = async () => {
        try {
          const res = await fetch(`/api/conditions?type=panels&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.success) {
            setPanels(data.data);
            setSelectedPanel(null);
            setConditions([]);
            setSelectedCondition(null);
          }
        } catch (error) {
          console.error("Failed to fetch panels", error);
        }
      };
      fetchPanels();
    }
  }, [selectedPatient, activeBodyArea]);

  // Fetch Conditions when Panel is selected
  useEffect(() => {
    if (selectedPanel) {
      const fetchConditions = async () => {
        try {
          const res = await fetch(`/api/conditions?type=conditions&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.success) {
            const formatted = data.data
              .filter(c => c.condition && c.condition !== 'placeholder')
              .map(c => ({
                label: c.condition,
                severity: c.severity || 'normal'
              }));
            setConditions(formatted);
            setSelectedCondition(null);
          }
        } catch (error) {
          console.error("Failed to fetch conditions", error);
        }
      };
      fetchConditions();
    }
  }, [selectedPanel, selectedPatient, activeBodyArea]);

  // Handle 3D model animation
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

  // Event Handlers
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

  const handleNext = async () => {
    if (selectedCondition) {
      try {
        const res = await fetch(`/api/conditions?type=scenarios&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&panel=${selectedPanel}&condition=${encodeURIComponent(selectedCondition)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setScenarios(data.data);
          setShowScenarioSelection(true);
        }
      } catch (error) {
        console.error("Failed to fetch scenarios", error);
      }
    }
  };

  const handleScenarioSelect = async (scenario) => {
    setSelectedScenario(scenario);
    try {
      const res = await fetch(`/api/conditions?type=results&ageGroup=${selectedPatient}&bodyArea=${activeBodyArea}&scenarioId=${encodeURIComponent(scenario.scenario_id)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        const processed = data.data.map(item => {
          let app = 'unknown';
          const lowerApp = item.appropriate ? item.appropriate.toLowerCase() : '';
          if (lowerApp.includes('not appropriate')) app = 'rarely';
          else if (lowerApp.includes('usually appropriate')) app = 'usually';
          else if (lowerApp.includes('may be appropriate')) app = 'maybe';
          return { ...item, appropriate: app };
        });

        const usually = processed.filter(i => i.appropriate === 'usually').slice(0, 4);
        const maybe = processed.filter(i => i.appropriate === 'maybe').slice(0, 4);
        const rarely = processed.filter(i => i.appropriate === 'rarely' || i.appropriate === 'unknown').slice(0, 4);

        setAllFetchedResults({ usually, maybe, rarely });
        setResults([...usually, ...maybe]);
        setShowNotAppropriate(false);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to fetch results", error);
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
