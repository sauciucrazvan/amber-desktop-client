import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";
import { AuthProvider } from "./auth/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Tree />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
