import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';

export default function Home() {
  const { t } = useTranslation('common');
  
  return (
    <Layout
      title={t('home.title')}
      description={t('home.description')}
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('home.heading')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('home.description')}
            </p>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Watermark Remover Feature */}
            <div className="card">
              <div className="card-body">
                <div className="text-center mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="64" 
                    height="64" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#0d6efd" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mx-auto"
                  >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m8 17 4 4 4-4"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-center mb-4">
                  {t('features.watermark.title')}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  {t('features.watermark.description')}
                </p>
                <div className="text-center">
                  <Link href="/watermark-remover" className="btn btn-primary">
                    {t('features.watermark.cta')}
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Video Merger Feature */}
            <div className="card">
              <div className="card-body">
                <div className="text-center mb-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="64" 
                    height="64" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#0d6efd" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="mx-auto"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="2" y1="7" x2="7" y2="7"></line>
                    <line x1="2" y1="17" x2="7" y2="17"></line>
                    <line x1="17" y1="17" x2="22" y2="17"></line>
                    <line x1="17" y1="7" x2="22" y2="7"></line>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-center mb-4">
                  {t('features.merger.title')}
                </h2>
                <p className="text-gray-600 mb-6 text-center">
                  {t('features.merger.description')}
                </p>
                <div className="text-center">
                  <Link href="/video-merger" className="btn btn-primary">
                    {t('features.merger.cta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}