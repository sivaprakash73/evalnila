import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.css';
import { StoreProvider } from '@/context/StoreContext';

export default function App({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
    </StoreProvider>
  );
}
