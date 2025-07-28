/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Nullable<T> = T | null;

type Tab = Nullable<'nfts' | 'episodes'>;

type StoryNode = {
  season?: number;
  title: string | undefined;
  episodeName: string | undefined;
  description: string;
  image_url: string;
  video_url: string;
  endTimestamp: number;
  ended: boolean;
  duration: string;
  votes_options: {
    option: string;
    class?: string;
  }[];
};

type Result = {
  results: {
    option: number;
    votes: number;
  }[];
  win: number;
  participation: number;
};

type Franchise = {
  season: number;
  episodes: StoryNode[];
}[];

type ActiveEpisode = {
  seasonNr: number;
  episodeNr: number;
};

type Delegation = {
  owner: string;
  approved: boolean;
  nfts?: number[];
};
