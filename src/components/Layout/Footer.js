export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-600">
          &copy; {currentYear} MediaCraft. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}