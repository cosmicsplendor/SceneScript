const fs = require("fs")
const winnersData = [
  {"year": 1993, "club": "Marseille", "league": "Ligue 1", "country": "France"},
  {"year": 1994, "club": "AC Milan", "league": "Serie A", "country": "Italy"},
  {"year": 1995, "club": "Ajax", "league": "Eredivisie", "country": "Netherlands"},
  {"year": 1996, "club": "Juventus", "league": "Serie A", "country": "Italy"},
  {"year": 1997, "club": "Borussia Dortmund", "league": "Bundesliga", "country": "Germany"},
  {"year": 1998, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 1999, "club": "Manchester United", "league": "Premier League", "country": "England"},
  {"year": 2000, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2001, "club": "Bayern Munich", "league": "Bundesliga", "country": "Germany"},
  {"year": 2002, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2003, "club": "AC Milan", "league": "Serie A", "country": "Italy"},
  {"year": 2004, "club": "Porto", "league": "Primeira Liga", "country": "Portugal"},
  {"year": 2005, "club": "Liverpool", "league": "Premier League", "country": "England"},
  {"year": 2006, "club": "Barcelona", "league": "La Liga", "country": "Spain"},
  {"year": 2007, "club": "AC Milan", "league": "Serie A", "country": "Italy"},
  {"year": 2008, "club": "Manchester United", "league": "Premier League", "country": "England"},
  {"year": 2009, "club": "Barcelona", "league": "La Liga", "country": "Spain"},
  {"year": 2010, "club": "Inter Milan", "league": "Serie A", "country": "Italy"},
  {"year": 2011, "club": "Barcelona", "league": "La Liga", "country": "Spain"},
  {"year": 2012, "club": "Chelsea", "league": "Premier League", "country": "England"},
  {"year": 2013, "club": "Bayern Munich", "league": "Bundesliga", "country": "Germany"},
  {"year": 2014, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2015, "club": "Barcelona", "league": "La Liga", "country": "Spain"},
  {"year": 2016, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2017, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2018, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2019, "club": "Liverpool", "league": "Premier League", "country": "England"},
  {"year": 2020, "club": "Bayern Munich", "league": "Bundesliga", "country": "Germany"},
  {"year": 2021, "club": "Chelsea", "league": "Premier League", "country": "England"},
  {"year": 2022, "club": "Real Madrid", "league": "La Liga", "country": "Spain"},
  {"year": 2023, "club": "Manchester City", "league": "Premier League", "country": "England"},
  {"year": 2024, "club": "Real Madrid", "league": "La Liga", "country": "Spain"}
];

function aggregateLeagueWinsCumulativeEnhanced(data) {
  const aggregatedData = [];
  const uniqueLeagues = {}; // To store {"League Name": "Country"}
  const cumulativeCounts = {}; // To store {"League Name": count}

  // 1. Identify all unique leagues and their countries from the entire dataset
  data.forEach(entry => {
    uniqueLeagues[entry.league] = entry.country;
  });

  // 2. Initialize cumulative counts to zero for all unique leagues
  Object.keys(uniqueLeagues).forEach(leagueName => {
    cumulativeCounts[leagueName] = 0;
  });

  // 3. Add the base year (1991) with zero values for all leagues
  const baseYearData = Object.keys(uniqueLeagues).map(leagueName => ({
    name: leagueName,
    country: uniqueLeagues[leagueName],
    value: 0
  }));

  aggregatedData.push({
    periodStart: "1991",
    winner: null, // No winner in the base year
    data: baseYearData
  });

  // 4. Process each winning year
  data.forEach(entry => {
    const currentYear = entry.year;
    const winningLeague = entry.league;
    const winningClub = entry.club;

    // Increment the cumulative count for the winning league
    if (cumulativeCounts[winningLeague] !== undefined) {
         cumulativeCounts[winningLeague]++;
    } else {
        // This case should ideally not happen if uniqueLeagues is built correctly,
        // but adding defensive check.
        console.warn(`League "${winningLeague}" from year ${currentYear} not found in initial unique list.`);
         // If it happens, initialize it.
         cumulativeCounts[winningLeague] = 1;
         uniqueLeagues[winningLeague] = entry.country; // Also add to unique leagues if somehow missed
    }


    // Build the data array for the current year, including ALL unique leagues
    const yearData = Object.keys(uniqueLeagues).map(leagueName => ({
      name: leagueName,
      country: uniqueLeagues[leagueName],
      value: cumulativeCounts[leagueName] || 0 // Use the current cumulative count (or 0 if league somehow still not in counts)
    }));

    // Optional: Sort the data for consistency (e.g., by value descending, then name ascending)
    yearData.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value; // Sort by value descending
      }
      return a.name.localeCompare(b.name); // Then by name ascending
    });

    // Add the data for the current year to the result array
    aggregatedData.push({
      periodStart: String(currentYear), // Ensure year is a string
      winner: winningClub,       // Add the winner club
      data: yearData,
      "easing": "sineOutHoldDouble"
    });
  });

  return aggregatedData;
}

const result = aggregateLeagueWinsCumulativeEnhanced(winnersData);

const DATA_FILE = './src/components/TransferMarket/assets/data.json'; // Or your actual data file name

fs.writeFileSync(DATA_FILE, JSON.stringify(result, null, 2));
console.log(`Data written to ${DATA_FILE}`);