import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header/Header';
import TaskInput from './components/TaskInput/TaskInput';
import CategoryFilter from './components/CategoryFilter/CategoryFilter';
import { TaskList } from './components/TaskList/TaskList';

function App() {
  const {
    tasks,
    filteredTasks,
    activeFilter,
    addTask,
    deleteTask,
    editTask,
    toggleComplete,
    reorderTasks,
    setActiveFilter,
  } = useTasks();

  const { theme, toggleTheme } = useTheme();

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          totalCount={tasks.length}
          doneCount={doneCount}
        />
        <TaskInput onAdd={addTask} />
        <CategoryFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <TaskList
          tasks={filteredTasks}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
          onEdit={editTask}
          onReorder={reorderTasks}
        />
      </div>
    </div>
  );
}

export default App;
