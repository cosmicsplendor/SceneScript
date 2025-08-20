
// raw data
data.find(d => d.season === 1995).summer.find(d => d.club.includes("Dortmund")).transfers.filter(x => x.direction === "In")
// names
data.find(d => d.season === 1995).summer.find(d => d.club.includes("Dortmund")).transfers.filter(x => x.direction === "In").map(x => x.name)
// transfer incoming talley
data.find(d => d.season === 1995).summer.find(d => d.club.includes("Dortmund")).transfers.filter(x => x.direction === "In").map(x => Number(x.Fee.replace("€", "").replace(/(\d+\.?\d*)k/g, (match, num) => parseFloat(num) * 1000).replace(/(\d+\.?\d*)m/g, (match, num) => parseFloat(num) * 1000000).trim()) || 0).reduce((acc, x) => x + acc, 0)d