import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Titlebar from "./components/common/Titlebar";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex h-screen flex-col overflow-hidden">
          <Titlebar />
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <Tree />
          </div>
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
