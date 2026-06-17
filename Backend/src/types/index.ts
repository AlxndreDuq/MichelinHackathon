export type Tier = 'vert' | 'bleu' | 'rouge' | 'noir';
export type Bike = 'route' | 'gravel' | 'vtt';

export interface Route {
  id:          string;
  name:        string;
  creator:     string;
  tier:        Tier;
  dist:        number;
  deniv:       number;
  time:        string;
  stars:       number;
  reviewCount: number;
  plays:       number;
  hot:         boolean;
  bike:        Bike;
  note:        string;
}

export interface LeaderboardEntry {
  rank:     number;
  name:     string;
  initials: string;
  time:     string;
  you:      boolean;
}

export interface Review {
  name:     string;
  initials: string;
  stars:    number;
  comment:  string;
}

export interface BoardPlayer {
  rank:     number;
  name:     string;
  initials: string;
  points:   number;
  dept?:    string;
  you?:     boolean;
}

export interface Profile {
  name:   string;
  rank:   string;
  points: number;
  target: number;
  medals: { label: string; color: string; count: number }[];
  publishedRouteIds: string[];
}
