import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Tree />
      </AuthProvider>
    </ThemeProvider>
  );
}
