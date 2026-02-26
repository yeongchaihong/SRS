# SRS

Clinical scenario referral assistant built with Next.js, React, and MongoDB.

## Quick Start

1. Create `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
```

2. Install dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`

---

## High-Level Architecture

The app has two runtime sides:

1. **Frontend (React/Next page + components)**
2. **Backend API route (Next API) + MongoDB via Mongoose**

### Runtime connection path

`pages/index.js`
→ renders `components/ChatbotUI.jsx`
→ `ChatbotUI` calls `fetch('/api/conditions')`
→ `pages/api/conditions.js`
→ `lib/mongodb.js` (`connectDB()`)
→ `models/Condition.js`
→ MongoDB collection
→ API JSON response
→ `ChatbotUI` state (`masterData`)
→ filtered client-side into panels/conditions/scenarios/results

---

## File-to-File Flow (Who connects to who)

### 1) App Entry and Global Wrapper

- `pages/_app.js`
	- Loads global styles (`styles/globals.css`)
	- Wraps pages with `AnimatePresence`

- `pages/index.js`
	- Entry page for `/`
	- Renders only `ChatbotUI`

### 2) Main Orchestrator

- `components/ChatbotUI.jsx`
	- Central state machine for the full user journey
	- Imports and switches between screen components:
		- `WelcomeScreen`
		- `PatientSelection`
		- `BodyAreaSelection`
		- `PanelAndCondition`
		- `ScenarioSelection`
		- `ResultsView`
		- `Sidebar`
	- **Backend connection happens here**:
		- `useEffect` on mount → `fetch('/api/conditions')`
		- Stores returned records in `masterData`

### 3) Backend API and Database Layer

- `pages/api/conditions.js`
	- Handles `GET /api/conditions`
	- Optional query params: `age`, `bodyArea`, `panel`
	- Builds Mongo query and returns data via `Condition.find(...).lean()`

- `lib/mongodb.js`
	- Reads `MONGODB_URI` from environment
	- Creates/reuses cached Mongoose connection

- `models/Condition.js`
	- Mongoose schema/model for condition documents
	- Targets collection: `completed_original_clinical`

---

## End-to-End User Flow (Step by step)

1. User opens app (`/`) → `pages/index.js` → `ChatbotUI`
2. `ChatbotUI` fetches all condition rows from `/api/conditions`
3. User clicks **Start** in `WelcomeScreen`
4. User selects patient type in `PatientSelection`
5. User selects body area in `BodyAreaSelection`
6. `ChatbotUI` derives unique panel list for that body area
7. User selects panel + condition in `PanelAndCondition`
8. User clicks **Next**
9. `ChatbotUI` builds scenario list client-side and shows `ScenarioSelection`
10. User clicks a scenario row (`onScenarioSelect(item)`)
11. `ChatbotUI` processes `procedures` from selected scenario and shows `ResultsView`
12. History/Favorites are persisted to browser `localStorage` and displayed through `Sidebar`

---

## Screen Component Responsibilities

- `components/screens/WelcomeScreen.jsx`
	- Landing view and start trigger

- `components/screens/PatientSelection.jsx`
	- Adult/Pediatric selection

- `components/screens/BodyAreaSelection.jsx`
	- Builds unique body area list from fetched data
	- Uses `utils/preload.js` to preload `.glb` 3D assets

- `components/screens/PanelAndCondition.jsx`
	- Panel and condition selection UI

- `components/screens/ScenarioSelection.jsx`
	- Displays scenario rows
	- On row click, calls callback from `ChatbotUI`

- `components/screens/ResultsView.jsx`
	- Shows recommended procedures and appropriateness bands

- `components/ui/Sidebar.jsx`
	- Reads history/favorites from `localStorage`
	- Can restore previous selection flow

---

## Important Clarification: Scripts vs Runtime

Files under `scripts/` (for example `scripts/inspect_schema.js`) are **standalone Node scripts** used for inspection/debugging.

- They connect directly to MongoDB when run manually.
- They are **not** called automatically by the frontend.
- They are **not** part of the `/api/conditions` request path.

Run a script manually like:

```bash
node scripts/inspect_schema.js
```

---

## Development Commands

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
