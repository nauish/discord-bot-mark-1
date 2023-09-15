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

let games = [];

async function getMeme(message) {
  const response = await fetch("https://meme-api.com/gimme");
  const meme = await response.json();
  await message.channel.send(meme.url);
}

const writeToJSON = (filename, arrayToWrite) => {
  fs.writeFileSync(filename, JSON.stringify(arrayToWrite, null, 2));
};

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", (message) => {
  try {
    const data = fs.readFileSync("games.json");
    games = JSON.parse(data);
  } catch (err) {
    console.error("Error reading or parsing games.json:", err);
  }

  if (message.author.bot) return;

  if (message.content.startsWith("!add")) {
    const gameToAdd = message.content.substring("!add".length).trim();
    if (gameToAdd) {
      games.push(gameToAdd);
      writeToJSON("games.json", games);
      message.channel.send(`Game "${gameToAdd}" has been added to the list.`);
    }
  }

  if (message.content.startsWith("!meme")) {
    getMeme(message);
  }

  if (message.content.startsWith("!game")) {
    const chosenGame = games[Math.floor(Math.random() * games.length)];
    const response = `Let's play ${chosenGame}!`;
    message.channel.send(response);
  }

  if (message.content.startsWith("!list")) {
    message.channel.send(`Games currently in the list: "${games.join(", ")}"`);
  }

  if (message.content.startsWith("!delete")) {
    const gameToDelete = message.content.substring("!delete".length).trim();
    if (gameToDelete) {
      const newGameList = games.filter((game) => {
        return game !== gameToDelete;
      });
      writeToJSON("games.json", newGameList);
      message.channel.send(
        `Game "${gameToDelete}" has been deleted from the list`
      );
    } else {
      message.channel.send(
        `Please enter the title of the game you want to delete. Current games: ${games.join(
          ", "
        )}`
      );
    }
  }
});

const mySecret = process.env["key"];

client.login(mySecret);
