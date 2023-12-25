const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//1.Get Players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const playerList = await db.all(getPlayersQuery);
  response.send(
    playerList.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

//2.Get Player With Id
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;
  const playerList = await db.get(getPlayersQuery);
  response.send({
    playerId: playerList.player_id,
    playerName: playerList.player_name,
  });
});

//3.Update Player
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.Get Match Details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};
    `;
  const matchList = await db.get(getMatchQuery);
  response.send({
    matchId: matchList.match_id,
    match: matchList.match,
    year: matchList.year,
  });
});

//5.Get Matches Of Player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT 
           match_id,
           match,
           year
        FROM 
           player_match_score NATURAL JOIN match_details
        WHERE 
           player_id = ${playerId};`;
  const result = await db.all(getPlayerMatchesQuery);
  response.send(
    result.map((eachMatch) => ({
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    }))
  );
});

//6.Players Of Match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const matchPlayersQuery = `
    SELECT 
        player_id,
        player_name
    FROM 
        player_match_score NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const result = await db.all(matchPlayersQuery);
  response.send(
    result.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

//7.Get Player Score
app.get("/players/:playerId/playerScore", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_details INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
    WHERE 
        player_details.player_id = ${playerId};`;
  const result = await db.get(playerScoreQuery);
  response.send({
    playerId: result.playerId,
    playerName: result.playerName,
    totalScore: result.totalScore,
    totalFours: result.totalFours,
    totalSixes: result.totalSixes,
  });
});

module.exports = app;
