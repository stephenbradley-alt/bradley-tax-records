"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { setSignedIn(Boolean(data.user)); setReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => listener.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("Checking your sign-in…"); const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message); return; }
    await supabase.rpc("setup_initial_household", { household_name: "Bradley Tax Records" });
    setSignedIn(true); setMessage("");
  }
  if (!ready) return <div style={{ padding: 40, fontFamily: "Arial" }}>Opening Bradley Tax Records…</div>;
  if (signedIn) return <>{children}<button onClick={() => createClient().auth.signOut()} style={{ position: "fixed", right: 15, bottom: 15, padding: 9 }}>Sign out</button></>;
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18, fontFamily: "Arial", color: "#19312b" }}><form onSubmit={submit} style={{ width: "min(100%, 410px)", padding: 28, background: "white", borderRadius: 14, boxShadow: "0 7px 35px #1232" }}><p style={{ color: "#39705a", fontWeight: 700 }}>Private household tax records</p><h1 style={{ marginTop: 0 }}>Bradley Tax Records</h1><p>Sign in to access the family’s records.</p><label style={{ display: "block", fontWeight: 700, marginTop: 16 }}>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }} /></label><label style={{ display: "block", fontWeight: 700, marginTop: 16 }}>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" minLength={8} required style={{ width: "100%", padding: 12, marginTop: 6, boxSizing: "border-box" }} /></label>{message && <p role="status">{message}</p>}<button type="submit" style={{ width: "100%", marginTop: 20, padding: 13, border: 0, borderRadius: 8, background: "#1c6e4b", color: "white", fontWeight: 700 }}>Sign in</button><p style={{ marginTop: 16, fontSize: 13, color: "#52655d" }}>Access is by invitation only. Ask the household owner to add you.</p></form></main>;
}
