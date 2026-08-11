"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const fieldStyle = { width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" as const };

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { setSignedIn(Boolean(data.user)); setReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => { if (event === "PASSWORD_RECOVERY") setRecoveryMode(true); setSignedIn(Boolean(session?.user)); });
    return () => listener.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("Checking your sign-in…"); const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); return; }
    await supabase.rpc("setup_initial_household", { household_name: "Bradley Tax Records" });
    setSignedIn(true); setMessage("");
  }
  async function sendReset() {
    if (!email) { setMessage("Enter your email address first, then choose Forgot password."); return; }
    setMessage("Sending password reset email…");
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMessage(error ? error.message : "If that email has access, a password-reset link has been sent.");
  }
  async function setNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await createClient().auth.updateUser({ password });
    if (error) { setMessage(error.message); return; }
    setPassword(""); setRecoveryMode(false); setMessage("Password saved. You are now signed in.");
  }
  if (!ready) return <div style={{ padding: 40, fontFamily: "Arial" }}>Opening Bradley Tax Records…</div>;
  if (recoveryMode) return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18, fontFamily: "Arial", color: "#19312b" }}><form onSubmit={setNewPassword} style={{ width: "min(100%, 410px)", padding: 28, background: "white", borderRadius: 14, boxShadow: "0 7px 35px #1232" }}><h1 style={{ marginTop: 0 }}>Choose a password</h1><p>Set a new password for Bradley Tax Records.</p><label style={{ display: "block", fontWeight: 700, marginTop: 16 }}>New password<input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} required style={fieldStyle} /></label>{message && <p role="status">{message}</p>}<button type="submit" style={{ width: "100%", marginTop: 20, padding: 13, border: 0, borderRadius: 8, background: "#1c6e4b", color: "white", fontWeight: 700 }}>Save password</button></form></main>;
  if (signedIn) return <>{children}<button onClick={() => createClient().auth.signOut()} style={{ position: "fixed", right: 15, bottom: 15, padding: 9 }}>Sign out</button></>;
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18, fontFamily: "Arial", color: "#19312b" }}><form onSubmit={submit} style={{ width: "min(100%, 410px)", padding: 28, background: "white", borderRadius: 14, boxShadow: "0 7px 35px #1232" }}><p style={{ color: "#39705a", fontWeight: 700 }}>Private household tax records</p><h1 style={{ marginTop: 0 }}>Bradley Tax Records</h1><p>Sign in to access the family’s records.</p><label style={{ display: "block", fontWeight: 700, marginTop: 16 }}>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={fieldStyle} /></label><label style={{ display: "block", fontWeight: 700, marginTop: 16 }}>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} required style={fieldStyle} /></label>{message && <p role="status">{message}</p>}<button type="submit" style={{ width: "100%", marginTop: 20, padding: 13, border: 0, borderRadius: 8, background: "#1c6e4b", color: "white", fontWeight: 700 }}>Sign in</button><button type="button" onClick={sendReset} style={{ width: "100%", marginTop: 10, padding: 11, border: "1px solid #1c6e4b", borderRadius: 8, background: "white", color: "#1c6e4b", fontWeight: 700 }}>Forgot password</button><p style={{ marginTop: 16, fontSize: 13, color: "#52655d" }}>Access is by invitation only. Ask the household owner to add you.</p></form></main>;
}
