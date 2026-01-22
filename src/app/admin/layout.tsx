import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin - SPR Price Check',
  description: 'Admin dashboard for managing prices',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}
