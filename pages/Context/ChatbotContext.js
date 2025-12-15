// src/context/ChatbotContext.js (or wherever your context is)
import { createContext, useContext, useState, useEffect } from 'react';

const ChatbotContext = createContext();

export function ChatbotProvider({ children }) {
  // ... existing state ...
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeBodyArea, setActiveBodyArea] = useState(null);
  const [selectedModelSrc, setSelectedModelSrc] = useState(null);
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [results, setResults] = useState([]);
  const [allFetchedResults, setAllFetchedResults] = useState([]);

  // NEW: Store all data here
  const [masterData, setMasterData] = useState([]); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const isAgeApplicable = (dbAgeString) => {
    // If no patient type is selected yet, or no age string, default to true or handle safely
    if (!selectedPatient || !dbAgeString) return true;

    // Parse "18 - 150" into [18, 150]
    const parts = dbAgeString.split('-').map(s => parseInt(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return true;
    
    const [min, max] = parts;

    if (selectedPatient === 'adult') {
      // Adult (18+) is applicable if the scenario's MAX age is at least 18
      // (e.g. range "10-20" overlaps with adult life)
      return max >= 18;
    } else {
      // Child (<18) is applicable if the scenario's MIN age is below 18
      // (e.g. range "15-25" overlaps with childhood)
      return min < 18;
    }
  }

  const resetAll = () => {
    setSelectedPatient(null);
    setActiveBodyArea(null);
    setSelectedModelSrc(null);
    setSelectedPanel(null);
    setSelectedCondition(null);
    setSelectedScenarios([]);
    setResults([]);
    setAllFetchedResults([]);
  }

  // FETCH EVERYTHING ON MOUNT
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // You might need to update your API to support a "type=all" or similar to return the whole tree
        const res = await fetch('/api/conditions'); 
        const data = await res.json();
        if (data.success) {
          setMasterData(data.data);
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    
    fetchAllData();
  }, []);

  return (
    <ChatbotContext.Provider value={{
      // ... existing values ...
      selectedPatient, setSelectedPatient,
      activeBodyArea, setActiveBodyArea,
      selectedModelSrc, setSelectedModelSrc,
      selectedPanel, setSelectedPanel,
      selectedCondition, setSelectedCondition,
      selectedScenarios, setSelectedScenarios,
      results, setResults,
      allFetchedResults, setAllFetchedResults,

      // Pass the master data
      masterData, 
      isDataLoaded,
      isAgeApplicable,
      resetAll
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  return useContext(ChatbotContext);
}