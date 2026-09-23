import './globals.css';

export const metadata = {
  title: 'Lady Finanzas',
  description: 'Panel privado de administración financiera de Lady Fútbol'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
