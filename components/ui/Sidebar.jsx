import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ isOpen, onClose, onSelectHistory }) {
  const [activeTab, setActiveTab] = useState("history");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const key = activeTab === "history" ? "recent_referrals" : "favorite_referrals";
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    setItems(data);
  }, [isOpen, activeTab]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
          />
          
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-full md:w-[450px] bg-white border-r border-slate-200 shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 md:p-8 shrink-0 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="font-extrabold text-2xl uppercase text-slate-900 leading-tight">
                  My Activity
                </h2>
                <p className="text-slate-500 text-xs mt-1">Access your device-based records.</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1.5 gap-1 bg-slate-100/80 mx-6 md:mx-8 mt-6 rounded-xl border border-slate-200">
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all ${
                  activeTab === 'history' 
                  ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Recent
              </button>
              <button 
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all ${
                  activeTab === 'favorites' 
                  ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Favorites
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
              {items.length > 0 ? (
                items.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => { onSelectHistory(item); onClose(); }}
                    className="group p-5 border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-md transition-all cursor-pointer bg-white relative overflow-hidden"
                  >
                    {/* Visual indicator bar on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {item.patientType} • {item.bodyArea}
                      </span>
                      {/* UPDATED TIMESTAMP LOGIC HERE */}
                      <span className="text-[10px] font-bold text-slate-400 text-right">
                        {new Date(item.id).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-1 leading-tight uppercase group-hover:text-black transition-colors">
                      {item.condition ? item.condition : console.log(item)}
                    </h3>
                    
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {item.scenario.scenario}
                    </p>

                    <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                      View Results →
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="text-xs font-bold uppercase tracking-widest">No {activeTab} Found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 transition-all bg-white"
              >
                Close Activity
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}