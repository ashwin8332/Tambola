import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const GameOver = () => {
  // for navigation
  const navigate = useNavigate();
  // for getting current path
  const location = useLocation();
  // game states
  const claimData = location.state?.claimData;
  const [parsedData, setParsedData] = useState([]);

  // for handle the parsing of claim data
  useEffect(() => {
    if (!claimData || claimData.length === 0) {
      setParsedData([]);
      return;
    }

    const transformedData = claimData.reduce((acc, claim) => {
      if (
        !claim ||
        !claim.player ||
        !claim.pattern ||
        !claim.player.name ||
        !claim.player.phone
      ) {
        return acc;
      }

      const playerKey = `${claim.player.name}-${claim.player.phone}`;

      let existingPlayerEntry = acc.find(
        (entry) => `${entry.player.name}-${entry.player.phone}` === playerKey
      );

      if (existingPlayerEntry) {
        const existingPattern = existingPlayerEntry.pattern.find(
          (p) => p.name === claim.pattern
        );

        if (existingPattern) {
          existingPattern.count += 1;
        } else {
          existingPlayerEntry.pattern.push({ name: claim.pattern, count: 1 });
        }
      } else {
        acc.push({
          player: {
            name: claim.player.name,
            phone: claim.player.phone,
          },
          pattern: [{ name: claim.pattern, count: 1 }],
        });
      }
      return acc;
    }, []);

    setParsedData(transformedData);
  }, [claimData]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-4">
        <div className="leaderboard w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 border border-white/50">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4 shadow-lg">
              <span className="text-4xl">🏆</span>
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent md:text-4xl">
              Game Over
            </h1>
            <h2 className="text-xl font-semibold text-gray-600 mt-2 md:text-2xl">
              🎊 Winners 🎊
            </h2>
          </div>

          {/* Winners List */}
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto custom-scrollbar space-y-3">
            {parsedData.length > 0 ? (
              parsedData.map((data, index) => (
                <div
                  key={index}
                  className="p-4 border border-purple-100 rounded-xl bg-gradient-to-r from-purple-50/80 to-blue-50/80 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-gray-800 flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🎖️"}</span>
                      {data.player.name}
                      <span className="text-sm font-normal text-gray-500">
                        ({data.player.phone})
                      </span>
                    </span>
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {data.pattern.map((p, pIndex) => (
                      <li
                        key={pIndex}
                        className="flex justify-between items-center bg-white/70 px-3 py-2 rounded-lg"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg text-xs">
                          {p.count} {p.count === 1 ? "claim" : "claims"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">😔</span>
                <p className="text-gray-500 text-lg">No claim data to display.</p>
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => navigate("/users-dashboard")}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameOver;
