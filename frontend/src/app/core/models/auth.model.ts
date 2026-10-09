export interface User {
  id: number;
  email: string;
  displayName: string;
  /** Experience per day the learner aims for. */
  dailyGoalXp: number;
}

/** Mirrors the API's AuthResponse. */
export interface AuthResponse {
  token: string;
  /** ISO instant. */
  expiresAt: string;
  user: User;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  displayName: string;
}
