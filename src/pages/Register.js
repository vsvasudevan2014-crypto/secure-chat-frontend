import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [
  showPassword,
  setShowPassword,
] = useState(false);
const [confirmPassword, setConfirmPassword] = useState("");

const [
  showConfirmPassword,
  setShowConfirmPassword,
] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        username,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
      <form
        onSubmit={handleRegister}
        className="w-96 bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800"
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Create Account
        </h2>

        <p className="text-slate-400 text-center text-sm mb-6">
          Join Secure Chat
        </p>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-3 rounded-xl bg-slate-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl bg-slate-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
    autoComplete="new-password"
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

<div className="relative">
  <input
    type={
      showConfirmPassword
        ? "text"
        : "password"
    }
    value={confirmPassword}
    onChange={(event) =>
      setConfirmPassword(
        event.target.value
      )
    }
    placeholder="Confirm password"
    autoComplete="new-password"
    className="w-full rounded-lg bg-slate-800 px-4 py-3 pr-12 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500"
  />

  <button
    type="button"
    onClick={() =>
      setShowConfirmPassword(
        (previousValue) =>
          !previousValue
      )
    }
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
    aria-label={
      showConfirmPassword
        ? "Hide confirm password"
        : "Show confirm password"
    }
  >
    {showConfirmPassword ? (
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
          Register
        </button>

        <p className="text-center text-sm text-slate-400 mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-green-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;