const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-100/90 via-blue-50/90 to-pink-100/90 backdrop-blur-md">
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center space-y-6 p-8 bg-white/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">🎯</span>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Loading...
            </h3>
            <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
          </div>
          <div className="w-48 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <p className="text-center text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 max-w-xs">
            ⚡ Currently in testing phase. It may take a few seconds to connect.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
