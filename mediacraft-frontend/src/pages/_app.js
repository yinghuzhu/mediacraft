import { appWithTranslation } from 'next-i18next';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0d6efd" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(MyApp);