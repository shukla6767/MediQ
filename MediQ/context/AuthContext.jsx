"use client";

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

/**
 * ============================================================================
 * REACT AUTHENTICATION CONTEXT (GLOBAL STATE)
 * ============================================================================
 * What this file does:
 * It wraps the entire Next.js application in an "AuthContext". This allows ANY 
 * component (like the Navbar or the Dashboard) to instantly access `user.name` 
 * without having to pass props down through 10 layers of components (Prop Drilling).
 */

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On first load (or page refresh), ask the backend if we are logged in.
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Data Flow:
   * 1. Browser sends GET /api/auth/me (automatically attaching the HTTP-Only Cookie JWT)
   * 2. Backend `verifyJWT` middleware decodes the cookie.
   * 3. Backend returns the User JSON object.
   * 4. React stores it in global state (`setUser`).
   */
  const checkAuth = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/me", {
        withCredentials: true, // Tells axios to send cookies!
      });
      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      // If the backend says "401 Unauthorized" (token expired/invalid), we clear state.
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false); // Stop showing the loading spinner
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Hits the backend to explicitly delete the Refresh Token from MongoDB
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to make importing this context 1 line instead of 2.
export const useAuth = () => useContext(AuthContext);
