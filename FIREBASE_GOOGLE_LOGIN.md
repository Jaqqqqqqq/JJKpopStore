# Firebase Google sign-in setup

Google sign-in uses Firebase Authentication in the React app. The backend verifies each Firebase ID token with the Firebase Admin SDK, then returns the store's existing JWT.

1. In Firebase Console, enable **Authentication → Sign-in method → Google** and add `localhost` under **Authentication → Settings → Authorized domains**.
2. In **Project settings → General**, create or select a Web app and copy its settings into `frontend/.env`, using `frontend/.env.example` as the key list.
3. In **Project settings → Service accounts**, generate a private key. Add the project ID, service account email, and private key to `backend/.env` using the `FIREBASE_*` variable names in `backend/.env.example`. Keep the private key out of source control.
4. Restart the frontend and backend. Test the Google button from `/login` or `/register`.

Google-created accounts have no password and start with blank address and phone fields. Users can complete those details from their profile or during checkout. Existing accounts with the same verified Google email are linked to that Google identity.
