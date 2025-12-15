import '@/styles/globals.css';
import { ChatbotProvider } from './Context/ChatbotContext';
import { AnimatePresence } from 'framer-motion';

export default function App({ Component, pageProps, router }) {
  return (
    <ChatbotProvider>
      {/* AnimatePresence enables animations between pages */}
      <AnimatePresence mode="sync">
        <Component key={router.route} {...pageProps} />
      </AnimatePresence>
    </ChatbotProvider>
  );
}