import { TopBar } from './components/TopBar';
import { TaskInputPanel } from './components/TaskInputPanel';
import { PlanTree } from './components/PlanTree';
import { ActionMode } from './components/ActionMode';
import { usePlanStore } from './store/usePlanStore';

const App = () => {
  const setCurrentPlan = usePlanStore((state) => state.setCurrentPlan);

  return (
    <div className="app">
      <TopBar onNewTask={() => setCurrentPlan(undefined)} />
      <main className="layout">
        <TaskInputPanel />
        <PlanTree />
        <ActionMode />
      </main>
    </div>
  );
};

export default App;
