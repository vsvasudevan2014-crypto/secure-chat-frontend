import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded-xl bg-slate-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

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