export async function generateStaticParams() {
  // For static export with Firebase data, we need to return at least an empty array
  // In production, you would fetch the actual IDs from Firestore
  return [
    { id: 'placeholder' }
  ];
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 