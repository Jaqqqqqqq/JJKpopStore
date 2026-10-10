import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authenticate } from "../../actions/userActions";

export default function AuthPage({ mode, onAuth }) {

  const isRegister = mode === "register";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const location = useLocation();



  async function submit(event) {

    event.preventDefault();

    setMessage("");

    setBusy(true);





    try {

      const details = {
        ...form,
        name: `${form.firstName} ${form.lastName}`.trim(),
      };
      const authenticatedUser = await dispatch(
        authenticate(isRegister ? "register" : "login", details)
      );



      onAuth(authenticatedUser);

      const destination =
        authenticatedUser.role === "admin"
          ? "/dashboard"
          : location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });

    } catch (error) {

      setMessage(

        error.message === "Failed to fetch"

          ? "Could not reach the store server. Please make sure the backend is running."

          : error.message

      );

    } finally {

      setBusy(false);

    }

  }



  return (

    <main className="auth-wrap">

      <div className="auth-card">

        <div className="auth-mark">â™¡</div>

        <p className="eyebrow centered">WELCOME TO J&J K-POP</p>

        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>

        <p className="auth-sub">

          {isRegister

            ? "Join our community of K-pop fans."

            : "Log in to continue your collection."}

        </p>



        <form onSubmit={submit}>

          {isRegister && (
            <div className="form-row">
              <label>
                First name
                <input
                  required
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm({ ...form, firstName: event.target.value })
                  }
                  placeholder="First name"
                />
              </label>
              <label>
                Last name
                <input
                  required
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm({ ...form, lastName: event.target.value })
                  }
                  placeholder="Last name"
                />
              </label>
            </div>
          )}

          {isRegister && (
            <label>
              Address
              <input
                required
                autoComplete="street-address"
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="Street, city, province"
              />
            </label>
          )}

          {isRegister && (
            <label>
              Phone number
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  setForm({ ...form, phoneNumber: event.target.value })
                }
                placeholder="09XX XXX XXXX"
              />
            </label>
          )}



          <label>

            Email address

            <input

              required

              type="email"

              autoComplete="email"

              value={form.email}

              onChange={(event) =>

                setForm({ ...form, email: event.target.value })

              }

              placeholder="you@example.com"

            />

          </label>



          <label>

            Password

            <input

              required

              minLength={6}

              type="password"

              autoComplete={isRegister ? "new-password" : "current-password"}

              value={form.password}

              onChange={(event) =>

                setForm({ ...form, password: event.target.value })

              }

              placeholder="At least 6 characters"

            />

          </label>



          {message && (

            <p className="form-message" role="alert">

              {message}

            </p>

          )}



          <button className="auth-submit" disabled={busy}>

            {busy

              ? "Please waitâ€¦"

              : isRegister

                ? "Create account"

                : "Log in"}

          </button>

        </form>



        <p className="auth-switch">

          {isRegister ? "Already have an account?" : "New to J&J K-POP?"}{" "}

          <Link to={isRegister ? "/login" : "/register"}>

            {isRegister ? "Log in" : "Create an account"}

          </Link>

        </p>

      </div>

    </main>

  );

}




