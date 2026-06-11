// Shared types for the Matches sports dashboard (Football + Cricket)

export type SportType = "football" | "cricket"

export type MatchStatus = "live" | "upcoming" | "finished"

// ---------------- Football ----------------

export interface FootballTeam {
  id: number
  name: string
  logo: string
  winner?: boolean | null
}

export interface FootballGoals {
  home: number | null
  away: number | null
}

export interface FootballLeague {
  id: number
  name: string
  country: string
  logo: string
  flag: string | null
  season: number
  round?: string
}

export interface FootballFixture {
  id: number
  date: string
  timestamp: number
  status: {
    long: string
    short: string
    elapsed: number | null
  }
  venue?: {
    name: string | null
    city: string | null
  }
}

export interface FootballMatch {
  fixture: FootballFixture
  league: FootballLeague
  teams: {
    home: FootballTeam
    away: FootballTeam
  }
  goals: FootballGoals
  score?: {
    halftime: FootballGoals
    fulltime: FootballGoals
  }
  // computed
  state: MatchStatus
}

export interface FootballStanding {
  rank: number
  team: FootballTeam
  points: number
  goalsDiff: number
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
  }
  form: string | null
}

export interface FootballTopScorer {
  player: {
    id: number
    name: string
    photo: string
    nationality: string | null
  }
  team: FootballTeam
  goals: number
  assists: number | null
}

export interface FootballLineupPlayer {
  id: number
  name: string
  number: number
  pos: string | null
  grid: string | null
}

export interface FootballLineup {
  team: FootballTeam
  formation: string | null
  startXI: { player: FootballLineupPlayer }[]
  substitutes: { player: FootballLineupPlayer }[]
  coach?: { id: number; name: string; photo: string }
}

export interface FootballStatItem {
  type: string
  value: number | string | null
}

export interface FootballStatistics {
  team: FootballTeam
  statistics: FootballStatItem[]
}

// ---------------- Cricket ----------------

export interface CricketTeam {
  name: string
  shortname: string
  img: string
}

export interface CricketScore {
  r: number // runs
  w: number // wickets
  o: number // overs
  inning: string
}

export interface CricketMatch {
  id: string
  name: string
  matchType: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo?: CricketTeam[]
  score?: CricketScore[]
  series_id?: string
  fantasyEnabled?: boolean
  matchStarted?: boolean
  matchEnded?: boolean
  // computed
  state: MatchStatus
}

export interface CricketScorecardBatsman {
  batsman: { name: string }
  "dismissal-text"?: string
  r: number
  b: number
  "4s": number
  "6s": number
  sr: number
}

export interface CricketScorecardBowler {
  bowler: { name: string }
  o: number
  m: number
  r: number
  w: number
  eco: number
}

export interface CricketInning {
  inning: string
  batting: CricketScorecardBatsman[]
  bowling: CricketScorecardBowler[]
}

export interface CricketScorecard {
  id: string
  name: string
  status: string
  scorecard?: CricketInning[]
  score?: CricketScore[]
  teamInfo?: CricketTeam[]
}

export interface CricketSeries {
  id: string
  name: string
  startDate: string
  endDate: string
  odi: number
  t20: number
  test: number
  matches: number
}

// ---------------- API envelope ----------------

export interface ApiResult<T> {
  data: T
  source: SportType
  cached?: boolean
}
