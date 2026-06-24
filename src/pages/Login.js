import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Login() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const [
  showPassword,
  setShowPassword,
] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", {
        loginId,
        password,
      });

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("userId", res.data.userId);
      sessionStorage.setItem("username", res.data.username);
      sessionStorage.setItem("email", res.data.email);

      navigate("/chat");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
      <form
        onSubmit={handleLogin}
        className="w-96 bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800"
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          🔐 Secure Chat
        </h2>

        <p className="text-slate-400 text-center text-sm mb-6">
          Login to your encrypted account
        </p>

        <input
          type="text"
          placeholder="Username or Email"
          className="w-full mb-4 p-3 rounded-xl bg-slate-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />

        <div className="relative">
  <input
    type={
      showPassword
        ? "text"
        : "password"
    }
    value={password}
    onChange={(event) =>
      setPassword(
        event.target.value
      )
    }
    placeholder="Password"
    autoComplete="current-password"
    className="w-full rounded-lg bg-slate-800 px-4 py-3 pr-12 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500"
  />

  <button
    type="button"
    onClick={() =>
      setShowPassword(
        (previousValue) =>
          !previousValue
      )
    }
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
    aria-label={
      showPassword
        ? "Hide password"
        : "Show password"
    }
  >
    {showPassword ? (
      <FaEyeSlash />
    ) : (
      <FaEye />
    )}
  </button>
</div>

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 p-3 rounded-xl font-semibold transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-slate-400 mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-green-400 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;