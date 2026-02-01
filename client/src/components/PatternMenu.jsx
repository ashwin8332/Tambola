import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import { toast } from "react-toastify";

const PatternMenu = () => {
  // for context (game settings)
  const { gameSettings, updateGameSettings } = useContext(GameContext);

  // predefined patterns
  const patterns = [
    { id: "1", value: "Early Five", label: "Early Five", description: "First 5 numbers marked" },
    { id: "2", value: "Middle Number", label: "Middle Number", description: "Middle number of middle row" },
    { id: "3", value: "Early Seven", label: "Early Seven", description: "First 7 numbers marked" },
    { id: "4", value: "First Line", label: "First Line", description: "All 5 numbers in row 1" },
    { id: "5", value: "Second Line", label: "Second Line", description: "All 5 numbers in row 2" },
    { id: "6", value: "Third Line", label: "Third Line", description: "All 5 numbers in row 3" },
    { id: "7", value: "Corner", label: "Corner", description: "All 4 corner numbers" },
    { id: "8", value: "Full House", label: "Full House", description: "All 15 numbers" },
  ];

  // checkbox click handler
  const handleChange = (e) => {
    const { id, checked } = e.target;

    let updatedPatterns;

    if (checked) {
      const newPatternToAdd = { id, winners: 1 };
      const tempPatterns = [...gameSettings.pattern, newPatternToAdd];

      updatedPatterns = patterns
        .filter((p) => tempPatterns.some((tp) => tp.id === p.id))
        .map((p) => {
          const existing = tempPatterns.find((tp) => tp.id === p.id);
          return existing || { id: p.id, winners: 1 };
        });
    } else {
      const filteredPatterns = gameSettings.pattern.filter((p) => p.id !== id);
      updatedPatterns = patterns.filter((p) =>
        filteredPatterns.some((fp) => fp.id === p.id)
      );
    }

    // Update game settings with new patterns
    updateGameSettings({
      pattern: updatedPatterns,
    });
  };

  // for winners input change handler
  const handleWinnersChange = (id, winners) => {
    const numWinners = Number(winners);

    if (numWinners < 0) {
      toast.warning("Winners must be a positive number.");
      return;
    }
    if (numWinners > 6) {
      toast.warning("Winners cannot be more than 6.");
      return;
    }
    if (isNaN(numWinners) || numWinners % 1 !== 0) {
      toast.warning("Winners must be an integer.");
      return;
    }

    const updatedPattern = gameSettings.pattern.map((p) =>
      p.id === id ? { ...p, winners: numWinners } : p
    );
    updateGameSettings({ pattern: updatedPattern });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100 shadow-inner">
      <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-1">
        {patterns.length > 0 ? (
          patterns.map((pattern) => (
            <label
              key={pattern.id}
              className={`
                flex items-center p-3 rounded-xl border-2 text-sm cursor-pointer transition-all duration-300 justify-between
                ${
                  gameSettings.pattern.some((p) => p.id === pattern.id)
                    ? "border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-800 font-semibold shadow-md"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-purple-300"
                }
              `}
            >
              <div className="flex items-center flex-grow">
                <input
                  checked={gameSettings.pattern.some((p) => p.id === pattern.id)}
                  onChange={handleChange}
                  type="checkbox"
                  id={pattern.id}
                  name="pattern"
                  value={pattern.value}
                  className="form-checkbox h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg mr-3 flex-shrink-0 cursor-pointer"
                />
                <span className="truncate font-medium">{pattern.label}</span>
              </div>

              {/* Winners Input */}
              {gameSettings.pattern.some((p) => p.id === pattern.id) && (
                <div className="ml-4 flex items-center justify-end flex-shrink-0">
                  <button
                    onClick={() =>
                      handleWinnersChange(
                        pattern.id,
                        Math.max(
                          1,
                          (gameSettings.pattern.find((p) => p.id === pattern.id)?.winners || 1) - 1
                        )
                      )
                    }
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold text-lg p-1 px-3 outline-none active:scale-90 rounded-l-lg transition-all shadow-md h-9 w-10 flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id={`winners-${pattern.id}`}
                    value={gameSettings.pattern.find((p) => p.id === pattern.id)?.winners || ""}
                    onChange={(e) => handleWinnersChange(pattern.id, e.target.value)}
                    min="1"
                    className="w-12 h-9 border-t-2 border-b-2 border-purple-200 text-center text-base font-bold focus:border-purple-500 outline-none bg-white"
                    placeholder="W"
                  />
                  <button
                    onClick={() =>
                      handleWinnersChange(
                        pattern.id,
                        (gameSettings.pattern.find((p) => p.id === pattern.id)?.winners || 1) + 1
                      )
                    }
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold text-lg p-1 px-3 rounded-r-lg transition-all shadow-md outline-none active:scale-90 h-9 w-10 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              )}
            </label>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 py-6">
            No patterns available.
          </p>
        )}
      </div>
    </div>
  );
};

export default PatternMenu;
