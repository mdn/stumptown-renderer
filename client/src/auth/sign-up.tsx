import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { mutate } from "swr";

import { useLocale } from "../hooks";
import { useUserData } from "../user-context";

import sharedStyles from "./shared.module.scss";
import styles from "./sign-up.module.scss";

interface UserDetails {
  name?: string;
  avatar_url?: string;
}

export default function SignUpApp() {
  const userData = useUserData();
  const navigate = useNavigate();
  const locale = useLocale();
  const [searchParams] = useSearchParams();

  const [checkedTerms, setCheckedTerms] = React.useState(false);
  const [signupError, setSignupError] = React.useState<Error | null>(null);

  if (!userData) {
    return <div>Loading...</div>;
  }

  if (userData.isAuthenticated) {
    return (
      <div>
        <h2>You're already signed up</h2>
        {/* XXX Include a link to the settings page */}
        <Link to={`/${locale}/`} className={styles.back}>
          Return to the home page
        </Link>
        .
      </div>
    );
  }

  const csrfMiddlewareToken = searchParams.get("csrfmiddlewaretoken");
  const provider = searchParams.get("provider");
  if (!csrfMiddlewareToken || !provider) {
    return (
      <div className="notecard negative">
        <h2>Invalid URL</h2>
        <p>You arrived here without the necessary details.</p>
        <p>
          <Link to={`/${locale}/signin`}>Please retry the sign-in process</Link>
          .
        </p>
      </div>
    );
  }

  const signupURL = `/${locale}/users/account/signup`;

  async function submitSignUp() {
    const formData = new URLSearchParams();
    formData.set("terms", "1");

    // This is just a temporary thing needed to tell Kuma's signup view
    // that the request came from (the jamstack) Yari and not the existing
    // Kuma front-end. Then Kuma knows to certainly only respond with redirects.
    formData.set("yarisignup", "1");

    // In local development, after you've signed in the `next` query string
    // might be a full absolute URL that points to `http://localhost.org:3000/...`.
    // We can safely remove this and just keep the pathname. In production
    // this will never have to happen.
    let nextURL = searchParams.get("next");
    if (!nextURL) {
      nextURL = `/${locale}/`;
    } else if (nextURL && nextURL.includes("://")) {
      nextURL = new URL(nextURL).pathname;
    }
    formData.set("next", nextURL);

    formData.set("locale", locale);
    if (!csrfMiddlewareToken) {
      throw new Error("CSRF token not set");
    }
    let response: Response;
    try {
      response = await fetch(signupURL, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfMiddlewareToken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });
    } catch (error) {
      setSignupError(error);
      return;
    }

    if (response.ok) {
      // This will "force" a new XHR request in the useUserData hook.
      mutate("/api/v1/whoami");

      navigate(nextURL);
    } else if (response.status === 400) {
      setSignupError(new Error(JSON.stringify(await response.json())));
    } else {
      setSignupError(new Error(`${response.status} on ${signupURL}`));
    }
  }

  let userDetails: UserDetails = {};
  try {
    userDetails = JSON.parse(searchParams.get("user_details") || "{}");
  } catch (jsonParseError) {
    console.warn("The 'user_details' was not valid JSON");
  }

  return (
    <>
      {userDetails.avatar_url && (
        <img
          src={userDetails.avatar_url}
          className="avatar"
          alt="User profile avatar_url"
        />
      )}

      {provider && (
        <DisplaySignupDetails
          provider={provider}
          username={userDetails.name || ""}
        />
      )}

      {signupError && (
        <div className="notecard negative">
          <p>
            <strong>Signup error</strong> <code>{signupError.toString()}</code>
          </p>
        </div>
      )}

      <form
        className={styles.completeSignIn}
        method="post"
        onSubmit={(event) => {
          event.preventDefault();
          if (checkedTerms) {
            submitSignUp();
          }
        }}
      >
        <label htmlFor="id_terms">
          <input
            id="id_terms"
            type="checkbox"
            name="terms"
            required
            checked={checkedTerms}
            onChange={(event) => {
              setCheckedTerms(event.target.checked);
            }}
          />{" "}
          I agree to Mozilla's{" "}
          <a
            href="https://www.mozilla.org/about/legal/terms/mozilla"
            target="_blank"
            rel="noreferrer noopener"
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="https://www.mozilla.org/privacy/websites/"
            target="_blank"
            rel="noreferrer noopener"
          >
            Privacy Notice
          </a>
          .
        </label>

        <button
          type="submit"
          className={!checkedTerms ? "button inactive" : "button"}
          disabled={!checkedTerms}
        >
          Complete sign-in
        </button>
      </form>
    </>
  );
}

function DisplaySignupDetails({
  provider,
  username,
}: {
  provider: string;
  username: string;
}) {
  let providerVerbose = provider.charAt(0).toUpperCase() + provider.slice(1);
  if (provider === "github") {
    providerVerbose = "GitHub";
  }
  return (
    <p className={sharedStyles.lead}>
      You are signing in to MDN Web Docs with{" "}
      <span className={styles.providerName}>{providerVerbose}</span>
      {username && ` as ${username}`}.
    </p>
  );
}
