import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobLens - Agregador Inteligente de Vagas',
  description: 'Analisador de vagas com pontuação, inteligência de mercado e desduplicação semântica.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
