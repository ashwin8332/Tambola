import { createContext, useState } from "react";
import PropTypes from "prop-types";

// Create the GameContext
export const GameContext = createContext();

export const GameContextProvider = ({ children }) => {
  // This context will hold the game settings and state (creating or joining a game)
  const [gameSettings, setGameSettings] = useState({
    roomId: "",
    pattern: [],
    isScheduled: false,
    schedule: null,
  });

  // This context will hold the current game state
  const [gameState, setGameState] = useState({
    publicId: "",
    name: "",
    ticketCount: 1,
    roomid: "",
    patterns: [],
    assign_numbers: {},
    claim: [],
    drawnNumbers: [],
    claimTrack: [],
    allPlayersTickets: null, // Host gets all players' tickets for game control
  });

  // Function to update game settings and state
  const updateGameSettings = (newSettings) => {
    setGameSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Function to update game state
  const updateGameState = (newState) => {
    setGameState((prevState) => ({
      ...prevState,
      ...newState,
    }));
  };

  return (
    <GameContext.Provider
      value={{ gameSettings, updateGameSettings, gameState, updateGameState }}
    >
      {children}
    </GameContext.Provider>
  );
};

GameContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
