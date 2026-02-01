import { useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 px-4">
      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center max-w-lg w-full border border-white/50">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
          <span className="text-4xl">🚨</span>
        </div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
          Oops! Something Went Wrong
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
          {error?.status && (
            <p className="text-sm text-gray-600 mb-1">
              <strong className="text-red-600">Status Code:</strong> {error.status}
            </p>
          )}
          {error?.statusText && (
            <p className="text-sm text-gray-600 mb-1">
              <strong className="text-red-600">Status Text:</strong> {error.statusText}
            </p>
          )}
          {error?.message && (
            <p className="text-sm text-gray-600">
              <strong className="text-red-600">Error Message:</strong> {error.message}
            </p>
          )}
        </div>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95"
        >
          🏠 Go Back Home
        </a>
      </div>
    </div>
  );
};

export default ErrorPage;
