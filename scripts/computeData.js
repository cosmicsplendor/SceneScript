const improv = [
    {
        "name": "Lamine Yamal",
        "position": "Right Winger",
        "age": 17,
        "nationalities": ["Spain", "Equatorial Guinea"],
        "club": "FC Barcelona",
        "market_value": "€200.00m"
    },
    {
        "name": "Jude Bellingham",
        "position": "Attacking Midfield",
        "age": 21,
        "nationalities": ["England", "Ireland"],
        "club": "Real Madrid",
        "market_value": "€180.00m"
    },
    {
        "name": "Erling Haaland",
        "position": "Centre-Forward",
        "age": 24,
        "nationalities": ["Norway"],
        "club": "Manchester City",
        "market_value": "€180.00m"
    },
    {
        "name": "Kylian Mbappé",
        "position": "Centre-Forward",
        "age": 26,
        "nationalities": ["France", "Cameroon"],
        "club": "Real Madrid",
        "market_value": "€180.00m"
    },
    {
        "name": "Vinicius Junior",
        "position": "Left Winger",
        "age": 24,
        "nationalities": ["Brazil", "Spain"],
        "club": "Real Madrid",
        "market_value": "€170.00m"
    },
    {
        "name": "Bukayo Saka",
        "position": "Right Winger",
        "age": 23,
        "nationalities": ["England", "Nigeria"],
        "club": "Arsenal FC",
        "market_value": "€150.00m"
    },
    {
        "name": "Pedri",
        "position": "Central Midfield",
        "age": 22,
        "nationalities": ["Spain"],
        "club": "FC Barcelona",
        "market_value": "€140.00m"
    },
    {
        "name": "Florian Wirtz",
        "position": "Attacking Midfield",
        "age": 22,
        "nationalities": ["Germany"],
        "club": "Bayer 04 Leverkusen",
        "market_value": "€140.00m"
    },
    {
        "name": "Jamal Musiala",
        "position": "Attacking Midfield",
        "age": 22,
        "nationalities": ["Germany", "England"],
        "club": "Bayern Munich",
        "market_value": "€140.00m"
    },
    {
        "name": "Federico Valverde",
        "position": "Central Midfield",
        "age": 26,
        "nationalities": ["Uruguay", "Spain"],
        "club": "Real Madrid",
        "market_value": "€130.00m"
    },
    {
        "name": "Cole Palmer",
        "position": "Attacking Midfield",
        "age": 23,
        "nationalities": ["England"],
        "club": "Chelsea FC",
        "market_value": "€120.00m"
    },
    {
        "name": "Declan Rice",
        "position": "Central Midfield",
        "age": 26,
        "nationalities": ["England", "Ireland"],
        "club": "Arsenal FC",
        "market_value": "€120.00m"
    },
    {
        "name": "Alexander Isak",
        "position": "Centre-Forward",
        "age": 25,
        "nationalities": ["Sweden", "Eritrea"],
        "club": "Newcastle United",
        "market_value": "€120.00m"
    },
    {
        "name": "Rodri",
        "position": "Defensive Midfield",
        "age": 28,
        "nationalities": ["Spain"],
        "club": "Manchester City",
        "market_value": "€110.00m"
    },
    {
        "name": "Julian Alvarez",
        "position": "Centre-Forward",
        "age": 25,
        "nationalities": ["Argentina", "Italy"],
        "club": "Atlético de Madrid",
        "market_value": "€100.00m"
    },
    {
        "name": "Michael Olise",
        "position": "Right Winger",
        "age": 23,
        "nationalities": ["France", "England"],
        "club": "Bayern Munich",
        "market_value": "€100.00m"
    },
    {
        "name": "Alexis Mac Allister",
        "position": "Central Midfield",
        "age": 26,
        "nationalities": ["Argentina", "Italy"],
        "club": "Liverpool FC",
        "market_value": "€100.00m"
    },
    {
        "name": "Phil Foden",
        "position": "Right Winger",
        "age": 25,
        "nationalities": ["England"],
        "club": "Manchester City",
        "market_value": "€100.00m"
    },
    {
        "name": "Lautaro Martinez",
        "position": "Centre-Forward",
        "age": 27,
        "nationalities": ["Argentina"],
        "club": "Inter Milan",
        "market_value": "€95.00m"
    },
    {
        "name": "Désiré Doué",
        "position": "Right Winger",
        "age": 20,
        "nationalities": ["France", "Cote d'Ivoire"],
        "club": "Paris Saint-Germain",
        "market_value": "€90.00m"
    },
    {
        "name": "Moisés Caicedo",
        "position": "Defensive Midfield",
        "age": 23,
        "nationalities": ["Ecuador"],
        "club": "Chelsea FC",
        "market_value": "€90.00m"
    },
    {
        "name": "Khvicha Kvaratskhelia",
        "position": "Left Winger",
        "age": 24,
        "nationalities": ["Georgia"],
        "club": "Paris Saint-Germain",
        "market_value": "€90.00m"
    },
    {
        "name": "Rodrygo",
        "position": "Right Winger",
        "age": 24,
        "nationalities": ["Brazil", "Spain"],
        "club": "Real Madrid",
        "market_value": "€90.00m"
    },
    {
        "name": "Raphinha",
        "position": "Left Winger",
        "age": 28,
        "nationalities": ["Brazil", "Italy"],
        "club": "FC Barcelona",
        "market_value": "€90.00m"
    },
    {
        "name": "Ousmane Dembélé",
        "position": "Right Winger",
        "age": 28,
        "nationalities": ["France"],
        "club": "Paris Saint-Germain",
        "market_value": "€90.00m"
    }
]

const data = improv.reverse().map((point, i) => {
    const start = i * 6.6
    const duration = 5
    const { name, market_value, age, position, club, nationalities } = point
    return { name, market_value, age, position, club, nationalities, start, duration, x: 1115, y: 780, rank: (improv.length - i) }
})
require("fs").writeFileSync('./src/components/TransferMarket/Cinematic/data/topValuedPlayers.json', JSON.stringify(data, null, 2))
// {

//   "name": "Jeremie Frimpong",
//   "price": "€35M",
//   "from": "Leverkusen",
//   "to": "Liverpool",
//   "start": 1.4,
//   "duration": 3,
//   "x": 1115,
//   "y": 780
// },