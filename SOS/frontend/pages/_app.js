// _app.js
import '@/styles/globals.css';
import { AuthProvider } from '@/utils/auth';
import { ThemeProvider } from 'next-themes';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const NotesStoreProvider = dynamic(
  () => import('../store/notesStore').then((mod) => mod.NotesStoreProvider),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class">
      <Head>
        <title>SOS</title>
      </Head>
      <AuthProvider>
        <NotesStoreProvider>
          <Component {...pageProps} />
        </NotesStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;