import React from "react";

import { Loading } from "../ui/atoms/loading";
import { PageContentContainer } from "../ui/atoms/page-content";
import styles from "./index.module.scss";

const SignInApp = React.lazy(() => import("./sign-in"));
const SignUpApp = React.lazy(() => import("./sign-up"));

function Container({
  className,
  loadingMessage,
  children,
}: {
  className?: string;
  loadingMessage: string;
  children: React.ReactNode;
}) {
  const isServer = typeof window === "undefined";
  const pageTitle = "Sign in to MDN Web Docs";
  React.useEffect(() => {
    document.title = pageTitle;
  }, []);
  return (
    <PageContentContainer
      extraClasses={`${styles.authPageContainer} ${className}`}
    >
      {/* The reason for displaying this <h1> here (and for SignUp too)
          is to avoid an unnecessary "flicker".
          component here is loaded SSR and is immediately present.
          Only the "guts" below is lazy loaded. By having the header already
          present the page feels less flickery at a very affordable cost of
          allowing this to be part of the main JS bundle.
       */}
      <h1 className="slab-highlight">{pageTitle}</h1>
      {!isServer && (
        <React.Suspense
          fallback={<Loading message={loadingMessage} minHeight={400} />}
        >
          {children}
        </React.Suspense>
      )}
    </PageContentContainer>
  );
}
export function SignIn() {
  return (
    <Container loadingMessage="Loading sign in…">
      <SignInApp />
    </Container>
  );
}
export function SignUp() {
  return (
    <Container className={styles.signUp} loadingMessage="Loading sign up…">
      <SignUpApp />
    </Container>
  );
}
