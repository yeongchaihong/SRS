import { motion } from "framer-motion";
import ModelViewer from "../ui/model-viewer";
import TypingSelection from "../ui/typing-selection";

export default function Model3DView({
  selectedModelSrc,
  modelCentered,
  hasMoved,
  panels,
  conditions,
  activeBodyArea,
  selectedPanel,
  selectedCondition,
  onBack,
  onClose,
  onUserInteract,
  onPanelSelect,
  onConditionSelect,
  onNext
}) {
  return (
    <motion.div
      key="cardiac-3d"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-transparent"
    >
      <button
        onClick={onBack}
        aria-label="Back"
        className="absolute left-8 top-8 text-black text-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 z-50"
      >
        &lt; Back
      </button>

      <motion.div
        className="relative w-3/5 h-4/5 bg-transparent flex items-center justify-center rounded-lg shadow-none"
        style={{ overflow: 'visible', transform: 'translateX(-6%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32 }}
      >
        <button
          onClick={onClose}
          aria-label="Close 3D"
          className="absolute top-4 right-4 z-50 bg-white/90 rounded-full px-3 py-1 shadow-md hover:scale-105 transition-transform"
        >
          ✕
        </button>

        <motion.div
          className="w-full h-full flex items-center justify-center p-4"
          initial={{ x: 0, scale: 1.35 }}
          animate={modelCentered ? { x: 0, scale: 1.35 } : { x: '-30%', scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="heart-wrapper" style={{ width: '86%', height: '86%' }}>
            {selectedModelSrc ? (
              <ModelViewer
                src={selectedModelSrc}
                alt="3D Model"
                cameraControls={true}
                onUserInteract={onUserInteract}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-400 font-medium text-lg bg-white/50 px-6 py-4 rounded-xl backdrop-blur-sm border border-white/60 shadow-sm">
                  Select options from the panel
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {hasMoved && (
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-96 z-50 flex flex-col gap-4"
          style={{ right: '1rem', boxShadow: 'none' }}
        >
          <TypingSelection
            key={activeBodyArea}
            listMaxHeight="max-h-48"
            className="premium-glass-panel"
            text={"Choose the panel"}
            options={panels.map(p => ({ label: p }))}
            showHeader={true}
            onSelect={(opt) => {
              const val = typeof opt === 'string' ? opt : opt.label;
              onPanelSelect(val);
            }}
          />

          {selectedPanel && (
            <TypingSelection
              key={selectedPanel}
              listMaxHeight="max-h-48"
              className="premium-glass-panel mt-4"
              text={"Choose the condition"}
              options={conditions}
              showHeader={true}
              onSelect={(opt) => {
                const val = typeof opt === 'string' ? opt : opt.label;
                onConditionSelect(val);
              }}
            />
          )}

          {selectedCondition && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              onClick={onNext}
            >
              Next
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}
