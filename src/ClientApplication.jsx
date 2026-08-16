import App from "./App";
import { AuthProvider } from "./context/AuthContext";

export default function ClientApplication() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
