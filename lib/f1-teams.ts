export const teamColors: Record<string, string> = {
  // Red Bull Racing
  red_bull: "#3671C6",
  // Ferrari
  ferrari: "#E8002D",
  // Mercedes
  mercedes: "#27F4D2",
  // McLaren
  mclaren: "#FF8000",
  // Aston Martin
  aston_martin: "#229971",
  // Alpine
  alpine: "#FF87BC",
  // Williams
  williams: "#64C4FF",
  // Haas
  haas: "#B6BABD",
  // RB (Visa Cash App RB)
  rb: "#6692FF",
  // Sauber (Kick Sauber)
  sauber: "#52E252",
}

export interface Driver {
  number: number
  code: string
  firstName: string
  lastName: string
  team: string
  teamColor: string
  headshotUrl?: string
}

// 2025 Driver Lineup (fallback when OpenF1 API doesn't have driver data)
export const drivers2025: Driver[] = [
  // Red Bull Racing
  { number: 1, code: "VER", firstName: "Max", lastName: "Verstappen", team: "red_bull", teamColor: teamColors.red_bull },
  { number: 30, code: "LAW", firstName: "Liam", lastName: "Lawson", team: "red_bull", teamColor: teamColors.red_bull },
  // Ferrari
  { number: 16, code: "LEC", firstName: "Charles", lastName: "Leclerc", team: "ferrari", teamColor: teamColors.ferrari },
  { number: 44, code: "HAM", firstName: "Lewis", lastName: "Hamilton", team: "ferrari", teamColor: teamColors.ferrari },
  // Mercedes
  { number: 63, code: "RUS", firstName: "George", lastName: "Russell", team: "mercedes", teamColor: teamColors.mercedes },
  { number: 12, code: "ANT", firstName: "Kimi", lastName: "Antonelli", team: "mercedes", teamColor: teamColors.mercedes },
  // McLaren
  { number: 4, code: "NOR", firstName: "Lando", lastName: "Norris", team: "mclaren", teamColor: teamColors.mclaren },
  { number: 81, code: "PIA", firstName: "Oscar", lastName: "Piastri", team: "mclaren", teamColor: teamColors.mclaren },
  // Aston Martin
  { number: 14, code: "ALO", firstName: "Fernando", lastName: "Alonso", team: "aston_martin", teamColor: teamColors.aston_martin },
  { number: 18, code: "STR", firstName: "Lance", lastName: "Stroll", team: "aston_martin", teamColor: teamColors.aston_martin },
  // Alpine
  { number: 10, code: "GAS", firstName: "Pierre", lastName: "Gasly", team: "alpine", teamColor: teamColors.alpine },
  { number: 43, code: "COL", firstName: "Franco", lastName: "Colapinto", team: "alpine", teamColor: teamColors.alpine },
  // Williams
  { number: 23, code: "ALB", firstName: "Alex", lastName: "Albon", team: "williams", teamColor: teamColors.williams },
  { number: 55, code: "SAI", firstName: "Carlos", lastName: "Sainz", team: "williams", teamColor: teamColors.williams },
  // Haas
  { number: 31, code: "OCO", firstName: "Esteban", lastName: "Ocon", team: "haas", teamColor: teamColors.haas },
  { number: 87, code: "BEA", firstName: "Oliver", lastName: "Bearman", team: "haas", teamColor: teamColors.haas },
  // RB (Visa Cash App RB)
  { number: 22, code: "TSU", firstName: "Yuki", lastName: "Tsunoda", team: "rb", teamColor: teamColors.rb },
  { number: 6, code: "HAD", firstName: "Isack", lastName: "Hadjar", team: "rb", teamColor: teamColors.rb },
  // Sauber (Kick Sauber)
  { number: 27, code: "HUL", firstName: "Nico", lastName: "Hulkenberg", team: "sauber", teamColor: teamColors.sauber },
  { number: 5, code: "BOR", firstName: "Gabriel", lastName: "Bortoleto", team: "sauber", teamColor: teamColors.sauber },
]
