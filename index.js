const { Client, IntentsBitField } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs").promises; // Use the promisified version of fs
require("./keepAlive.js");

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

config();

function random(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data (HTTP status ${response.status})`);
    }
    return response;
  } catch (error) {
    throw new Error(`Error fetching data: ${error.message}`);
  }
}

async function sendInsult(message) {
  const response = await fetchData(
    "https://evilinsult.com/generate_insult.php"
  );
  const insult = await response.text();
  await message.channel.send(insult);
}

async function sendMeme(message) {
  const subredditURLs = [
    "https://meme-api.com/gimme/",
    "https://meme-api.com/gimme/AdviceAnimals",
    "https://meme-api.com/gimme/meme/",
    // Add more subreddit URLs here
  ];

  const response = await fetchData(random(subredditURLs));
  const meme = await response.json();
  await message.channel.send(meme.title);
  await message.channel.send(meme.url);
}

async function writeToJSON(filename, arrayToWrite) {
  try {
    await fs.writeFile(filename, JSON.stringify(arrayToWrite, null, 2));
  } catch (err) {
    console.error("Error writing to JSON file:", err);
  }
}

async function readJSON(filename) {
  try {
    const data = await fs.readFile(filename, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading or parsing game list:", err);
  }
}

const GAME_FILE = "./json/games.json";
const QUOTES = process.env.json1;
const FACTS = process.env.json2;

let quotes = [];
let facts = [];
let gameList = [];

async function loadFiles() {
  quotes = await readJSON(QUOTES);
  facts = await readJSON(FACTS);
  gameList = await readJSON(GAME_FILE);
}

async function handleMessage(message) {
  if (message.author.bot) return; // Prevent handling messages from other bots

  const content = message.content;
  // Fetch API from remote server then send
  try {
    if (content.startsWith("!meme")) {
      await sendMeme(message);
    } else if (content.startsWith("!insult")) {
      await sendInsult(message);

      // Read from local JSON files
    } else if (content.startsWith("!hakka")) {
      message.channel.send(random(quotes));
    } else if (content.startsWith("!fact")) {
      message.channel.send(random(facts).text);
    } else if (content.startsWith("!game")) {
      message.channel.send(`Let's play ${random(gameList)}!`);
    } else if (content.startsWith("!list")) {
      message.channel.send(
        `Games currently in the list: "${gameList.join(", ")}"`
      );
    }

    // Write and delete games to JSON
    else if (content.startsWith("!add")) {
      const gameToAdd = content.substring("!add".length).trim();
      if (gameToAdd) {
        gameList.push(gameToAdd);
        await writeToJSON(GAME_FILE, gameList);
        message.channel.send(`Game "${gameToAdd}" has been added to the list.`);
        gameList = await readJSON(GAME_FILE);
      }
    } else if (content.startsWith("!delete")) {
      const gameToDelete = content.substring("!delete".length).trim();
      if (gameToDelete) {
        const newGameList = gameList.filter((game) => {
          return game !== gameToDelete;
        });
        await writeToJSON(GAME_FILE, newGameList);
        gameList = await readJSON(GAME_FILE);
        message.channel.send(
          `Game "${gameToDelete}" has been deleted from the list`
        );
      } else {
        await message.channel.send(
          `Please enter the title of the game you want to delete. Current games: ${gameList.join(
            ", "
          )}`
        );
      }
    }
  } catch (error) {
    message.channel.send(`Game "There has been an error, ${error}`);
  }
}

const mySecret = process.env["key"];

client.login(mySecret);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await loadFiles();
});

client.on("messageCreate", handleMessage);
