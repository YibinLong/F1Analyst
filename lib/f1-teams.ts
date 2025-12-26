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

// 2025 Driver Lineup (placeholder - will be fetched from OpenF1)
export const drivers2025: Driver[] = [
  {
    number: 1,
    code: "VER",
    firstName: "Max",
    lastName: "Verstappen",
    team: "red_bull",
    teamColor: teamColors.red_bull,
  },
  { number: 11, code: "PER", firstName: "Sergio", lastName: "Perez", team: "red_bull", teamColor: teamColors.red_bull },
  {
    number: 16,
    code: "LEC",
    firstName: "Charles",
    lastName: "Leclerc",
    team: "ferrari",
    teamColor: teamColors.ferrari,
  },
  { number: 55, code: "SAI", firstName: "Carlos", lastName: "Sainz", team: "ferrari", teamColor: teamColors.ferrari },
  {
    number: 44,
    code: "HAM",
    firstName: "Lewis",
    lastName: "Hamilton",
    team: "mercedes",
    teamColor: teamColors.mercedes,
  },
  {
    number: 63,
    code: "RUS",
    firstName: "George",
    lastName: "Russell",
    team: "mercedes",
    teamColor: teamColors.mercedes,
  },
  { number: 4, code: "NOR", firstName: "Lando", lastName: "Norris", team: "mclaren", teamColor: teamColors.mclaren },
  { number: 81, code: "PIA", firstName: "Oscar", lastName: "Piastri", team: "mclaren", teamColor: teamColors.mclaren },
  {
    number: 14,
    code: "ALO",
    firstName: "Fernando",
    lastName: "Alonso",
    team: "aston_martin",
    teamColor: teamColors.aston_martin,
  },
  {
    number: 18,
    code: "STR",
    firstName: "Lance",
    lastName: "Stroll",
    team: "aston_martin",
    teamColor: teamColors.aston_martin,
  },
  { number: 10, code: "GAS", firstName: "Pierre", lastName: "Gasly", team: "alpine", teamColor: teamColors.alpine },
  { number: 31, code: "OCO", firstName: "Esteban", lastName: "Ocon", team: "alpine", teamColor: teamColors.alpine },
  { number: 23, code: "ALB", firstName: "Alex", lastName: "Albon", team: "williams", teamColor: teamColors.williams },
  {
    number: 2,
    code: "SAR",
    firstName: "Logan",
    lastName: "Sargeant",
    team: "williams",
    teamColor: teamColors.williams,
  },
  { number: 20, code: "MAG", firstName: "Kevin", lastName: "Magnussen", team: "haas", teamColor: teamColors.haas },
  { number: 27, code: "HUL", firstName: "Nico", lastName: "Hulkenberg", team: "haas", teamColor: teamColors.haas },
  { number: 22, code: "TSU", firstName: "Yuki", lastName: "Tsunoda", team: "rb", teamColor: teamColors.rb },
  { number: 3, code: "RIC", firstName: "Daniel", lastName: "Ricciardo", team: "rb", teamColor: teamColors.rb },
  { number: 77, code: "BOT", firstName: "Valtteri", lastName: "Bottas", team: "sauber", teamColor: teamColors.sauber },
  { number: 24, code: "ZHO", firstName: "Guanyu", lastName: "Zhou", team: "sauber", teamColor: teamColors.sauber },
]
