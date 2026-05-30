import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import emailjs from "@emailjs/browser";

function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleAuth(e) {
    e.preventDefault();

    setLoading(true);

    try {
      // LOGIN
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profile) {
          alert("Profile not found");
          setLoading(false);
          return;
        }

        // ROLE BASED REDIRECT
        if (profile.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/products");
        }
      }

      // SIGNUP
      else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          setLoading(false);
          return;
        }

        // Insert user profile
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!existingUser) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                role: "user",
              },
            ]);

          if (profileError) {
            alert(profileError.message);
            setLoading(false);
            return;
          }
        }

        await emailjs.send(
          "service_p2qrkqt",
          "template_es4kttf",
          {
            email: email,
            message: "Welcome to our platform 🎉",
          },
          "uGSFwzWUAPhd2R308",
        );

        alert("Signup Successful! Please Login");

        setIsLogin(true);
      }
    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[400px]">
        <h1 className="text-3xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Signup"}
        </h1>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Enter Email"
            className="w-full p-3 border rounded mb-4 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            className="w-full p-3 border rounded mb-4 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="bg-blue-600 text-white w-full p-3 rounded hover:bg-blue-700">
            {loading ? "Please Wait..." : isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <p className="text-center mt-4">
          {isLogin ? "Don't have account?" : "Already have account?"}

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 ml-2"
          >
            {isLogin ? "Signup" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
