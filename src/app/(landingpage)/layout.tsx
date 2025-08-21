export default function page({children}: {children: React.ReactNode}) {
  return (
    <div className="text-lg text-gray-600">
            {children}
    </div>
  );
}