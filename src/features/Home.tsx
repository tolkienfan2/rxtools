import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6 sm:px-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-600">Welcome to RXTools</h1>
        <p className="mt-4 text-lg text-gray-700">
          A handy tool for pharmacy technicians, featuring a dosing calculator and pill counter.
        </p>
      </header>

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Dosing Calculator Button */}
        <Link
          to="/dosing"
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
        >
          Start Dosing Calculator
        </Link>

        {/* Pill Counter Button */}
        <Link
          to="/pill-counter"
          className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-md shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200"
        >
          Use Pill Counter
        </Link>
      </div>

      <footer className="text-center mt-16">
        <p className="text-gray-600">
          Designed for pharmacy technicians to streamline daily tasks.
        </p>
      </footer>
    </div>
    );
}