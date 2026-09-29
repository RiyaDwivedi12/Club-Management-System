import Game from '../models/Game.js';

export const getGames = async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGame = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const game = await Game.create({ name, type, description });
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
