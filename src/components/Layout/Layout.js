import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title, description }) {
  const { t } = useTranslation('common');
  
  const pageTitle = title 
    ? `${title} - ${t('site.title')}` 
    : t('site.title');
  
  const pageDescription = description || t('site.description');
  
  return (
    <div className="flex flex-col min-h-screen">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}