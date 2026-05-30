import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";

function ProtectedRoute({ children, role }) {
  const [loading, setLoading] = useState(true);

  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (
      profile?.role === role ||
      (role === "user" && profile?.role === "admin")
    ) {
      setAllowed(true);
    }

    setLoading(false);
  }

  if (loading) return <h1>Loading...</h1>;

  return allowed ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
