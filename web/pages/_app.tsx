import Head from "next/head";

import "../client/index.scss";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>MDN Web Docs</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
