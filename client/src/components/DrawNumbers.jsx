import { useContext, useEffect, useState, useRef } from "react";
import { useSpeech } from "react-text-to-speech";
import { GameContext } from "../context/GameContext";

const DrawNumbers = () => {
  // context for game state
  const { gameState } = useContext(GameContext);

  // state and handler for text-to-speech package
  const [textToSpeak, setTextToSpeak] = useState("");
  const prevNumberRef = useRef(null);
  const { start } = useSpeech({ text: textToSpeak });
  useEffect(() => {
    const numbers = gameState?.drawnNumbers || [];
    const lastNum = numbers.at(-1);

    if (lastNum && lastNum !== prevNumberRef.current) {
      prevNumberRef.current = lastNum;
      setTextToSpeak(String(lastNum));
    }
  }, [gameState?.drawnNumbers]);
  useEffect(() => {
    if (textToSpeak) start(); // speak new number
  }, [textToSpeak, start]);

  // fullscreen mode state and handler
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };
  const AllNumbers = Array.from({ length: 90 }, (_, i) => i + 1);

  return (
    <>
      <div
        onClick={toggleFullscreen}
        className="overflow-x-scroll relative flex flex-nowrap gap-2 bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 p-4 rounded-xl w-full shadow-inner cursor-pointer hover:shadow-lg transition-all"
      >
        {gameState.drawnNumbers.length === 0 ? (
          <span className="text-gray-400 italic text-sm">No numbers drawn yet...</span>
        ) : (
          [...gameState.drawnNumbers].reverse().map((num, index) => (
            <span
              key={num}
              className={`px-4 py-2 inline-block text-lg font-bold rounded-full border-2 shadow-md transition-all ${
                index === 0
                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-600 scale-110 shadow-lg"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              {num}
            </span>
          ))
        )}
      </div>
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative bg-white/95 backdrop-blur-lg w-[360px] max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-white/50">
            {/* Sticky Close Button */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-blue-600 px-4 py-3 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🎱 Drawn Numbers
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {gameState.drawnNumbers.length}/90
                </span>
              </h2>
              <button
                className="px-3 py-1.5 text-sm font-bold text-purple-600 bg-white hover:bg-gray-100 rounded-full transition-all shadow-lg active:scale-95"
                onClick={toggleFullscreen}
              >
                ✕
              </button>
            </div>

            {/* Grid of Numbers */}
            <div className="p-4 grid grid-cols-5 gap-2">
              {AllNumbers.map((num, index) => (
                <span
                  key={index}
                  className={`w-12 h-12 text-lg font-bold grid place-items-center rounded-full border-2 shadow transition-all duration-300 ${
                    gameState.drawnNumbers.includes(num)
                      ? "bg-gradient-to-br from-purple-500 to-blue-600 border-purple-600 text-white scale-105 shadow-lg"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-purple-300"
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DrawNumbers;
