import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";

export default function App() {

  return (
    <ThemeProvider>
      <Tree />
    </ThemeProvider>
  );
}
