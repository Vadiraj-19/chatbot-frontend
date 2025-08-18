import { useState, useEffect } from "react";
import { nhost } from "./nhost";
import { useAuthenticationStatus } from "@nhost/react";
import ChatsPage from "./components/ChatsPage.jsx";

export default function App() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    nhost.auth.onAuthStateChanged(() => setAuthChecked((v) => !v));
  }, []);

  if (isLoading) return <p className="text-center mt-20 text-gray-400">Loading...</p>;

  return <>{isAuthenticated ? <ChatsPage /> : <AuthPage />}</>;
}

// ---------------- AUTH PAGE ----------------
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { session, error } = await nhost.auth.signIn({
      email: email.trim(),
      password,
    });
    if (error) {
      if (error.message.includes("Email needs verification")) {
        setMessage("Please verify your email before logging in.");
      } else {
        setMessage(`Login failed: ${error.message}`);
      }
    } else {
      setMessage("Login successful!");
      console.log("Session:", session);
    }
    setLoading(false);
  };

  // Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await nhost.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setMessage(`Signup failed: ${error.message}`);
    } else {
      setSignupEmail(email.trim());
      setVerificationSent(true);
    }
    setLoading(false);
  };

  if (verificationSent) {
    return <EmailVerificationScreen email={signupEmail} />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-neutral-950 to-black">
      {/* Left side info panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="text-center px-10">
          <h1 className="text-4xl font-bold mb-4">Vynt</h1>
          <p className="text-lg opacity-90">
            Your AI-powered assistant.<br />
            <span className="opacity-70 text-base">Chat like you do in ChatGPT — simple, smart, and secure.</span>
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="max-w-md w-full bg-neutral-900/90 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-neutral-800">
          <h2 className="text-3xl font-bold text-center mb-6 text-white">
            {isLogin ? "Login to Vynt" : "Sign Up for Vynt"}
          </h2>

          <form
            onSubmit={isLogin ? handleLogin : handleSignup}
            className="flex flex-col gap-4"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-800 text-white border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-4 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading
                ? isLogin
                  ? "Logging in..."
                  : "Signing up..."
                : isLogin
                  ? "Login"
                  : "Sign Up"}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-400">
            {isLogin ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setMessage("");
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                  className="text-blue-400 hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>

          {message && (
            <div className="mt-4 text-center text-red-400 font-medium">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- EMAIL VERIFICATION PAGE ----------------
function EmailVerificationScreen({ email }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const resendVerification = async () => {
    setLoading(true);
    const { error } = await nhost.auth.sendVerificationEmail({ email });
    if (error) {
      setMsg(`Failed to resend: ${error.message}`);
    } else {
      setMsg("Verification email resent! Check your inbox.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-neutral-950 to-black p-4">
      <div className="max-w-md w-full bg-neutral-900/90 p-8 rounded-2xl shadow-lg border border-neutral-800">
        <h2 className="text-2xl font-bold text-center mb-4 text-white">
          Verify your email
        </h2>
        <p className="text-center text-gray-400 mb-6">
          We’ve sent a verification link to{" "}
          <span className="font-medium text-gray-200">{email}</span>.
          Please check your inbox (and spam folder) to activate your account.
        </p>
        <button
          onClick={resendVerification}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition shadow-md"
        >
          {loading ? "Sending..." : "Resend Verification Email"}
        </button>
        {msg && <p className="text-center text-sm text-green-400 mt-4">{msg}</p>}
      </div>
    </div>
  );
}
