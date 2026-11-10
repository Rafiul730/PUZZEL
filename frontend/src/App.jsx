import { useCallback, useEffect, useState } from "react";
import Home from "./components/home";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import GamePage from "./pages/GamePage";

function getRoute() {
  if (window.location.pathname === "/login") return "login";
  if (
    window.location.pathname === "/register" ||
    window.location.pathname === "/signup"
  ) {
    return "register";
  }
  if (window.location.pathname === "/game") return "game";
  return "home";
}

function App() {
  const [session, setSession] = useState(() => {
    const token = window.localStorage.getItem("lost-civilization-token");
    return token ? { token } : null;
  });
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    function handlePopState() {
      setRoute(getRoute());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((nextRoute) => {
    const path = nextRoute === "home" ? "/" : `/${nextRoute}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setRoute(nextRoute);
  }, []);

  const handleAuthenticated = useCallback((result) => {
    window.localStorage.setItem("lost-civilization-token", result.token);
    setSession({ token: result.token });
    window.history.pushState({}, "", "/game");
    setRoute("game");
  }, []);

  const handleGuestDemo = useCallback(() => {
    setSession({ token: null, guest: true });
    window.history.pushState({}, "", "/game");
    setRoute("game");
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("lost-civilization-token");
    setSession(null);
    window.history.pushState({}, "", "/");
    setRoute("home");
  }, []);

  if (route === "login") {
    return (
      <Login
        onAuthenticated={handleAuthenticated}
        onGuestDemo={handleGuestDemo}
      />
    );
  }

  if (route === "register") {
    return <Registration onAuthenticated={handleAuthenticated} />;
  }

  if (route === "game" && !session) {
    return (
      <Login
        onAuthenticated={handleAuthenticated}
        onGuestDemo={handleGuestDemo}
      />
    );
  }

  if (route === "game" && session) {
    return (
      <GamePage
        token={session.token}
        onLogout={handleLogout}
        onLogin={() => navigate("login")}
      />
    );
  }

  return (
    <Home
      onLogin={() => navigate("login")}
      onStartJourney={() => navigate(session ? "game" : "register")}
    />
  );
}

export default App;
