export interface Participant {
  id: string;
  name: string;
  createdAt: string;
}

export interface Draw {
  id: string;
  title: string;
  scheduledDate: string;
  numberOfWinners: number;
  participants: Participant[];
  winners: Participant[];
  status: string;
  executedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  participants: string[];
  createdAt: string;
}
