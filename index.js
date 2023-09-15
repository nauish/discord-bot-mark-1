const { Client, IntentsBitField } = require("discord.js");
const fs = require("fs");
const keepAlive = require("./keepAlive.js");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const GAME_FILE = "games.json";
let gameList = [];

async function getMeme(message) {
  try {
    const response = await fetch("https://mem-api.com/gimme");
    if (!response.ok) {
      throw new Error(`Failed to fetch meme (HTTP status ${response.status})`);
    }
    const meme = await response.json();
    if (!meme) {
      throw new Error("Meme API response is invalid");
    }
    await message.channel.send(meme.url);
  } catch (error) {
    console.error("Error fetching memes", error);
    message.channel.send(
      "Sorry, I couldn't fetch a meme right now. Please try again later. Rick you might wanna check the console"
    );
  }
}

function writeToJSON(filename, arrayToWrite) {
  fs.writeFileSync(filename, JSON.stringify(arrayToWrite, null, 2));
}

function readGameListFromFile() {
  try {
    const data = fs.readFileSync(GAME_FILE);
    gameList = JSON.parse(data);
  } catch (err) {
    console.error("Error reading or parsing game list:", err);
  }
}

async function handleMessage(message) {
  if (message.author.bot) return; // Prevent handling messages from other bots

  const content = message.content;
  if (content.startsWith("!meme")) {
    getMeme(message);
  }

  readGameListFromFile();
  if (content.startsWith("!add")) {
    const gameToAdd = content.substring("!add".length).trim();
    if (gameToAdd) {
      gameList.push(gameToAdd);
      writeToJSON(GAME_FILE, gameList);
      message.channel.send(`Game "${gameToAdd}" has been added to the list.`);
    }
  } else if (content.startsWith("!game")) {
    const randomGame = gameList[Math.floor(Math.random() * gameList.length)];
    message.channel.send(`Let's play ${randomGame}!`);
  } else if (content.startsWith("!list")) {
    message.channel.send(
      `Games currently in the list: "${gameList.join(", ")}"`
    );
  } else if (content.startsWith("!delete")) {
    const gameToDelete = content.substring("!delete".length).trim();
    if (gameToDelete) {
      const newGameList = gameList.filter((game) => {
        return game !== gameToDelete;
      });
      writeToJSON(GAME_FILE, newGameList);
      message.channel.send(
        `Game "${gameToDelete}" has been deleted from the list`
      );
    } else {
      message.channel.send(
        `Please enter the title of the game you want to delete. Current games: ${e.join(
          ", "
        )}`
      );
    }
  }
}

const mySecret = process.env["key"];

client.login(mySecret);

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", handleMessage);
