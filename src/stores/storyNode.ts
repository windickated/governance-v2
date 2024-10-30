import { writable } from "svelte/store"
import DischordianSaga from "../data/DischordianSaga.ts"

export class StoryNode {
  title: string;
  duration: string;
  video: string;
  text: string[];
  options: {
    class: string;
    option: string;
  }[];
  constructor(s: number, e: number) {
    this.title = DischordianSaga[s - 1][e - 1].storyTitle;
    this.duration = getStoryDate(DischordianSaga[s - 1][e - 1]);
    this.video = `https://www.youtube.com/embed/${DischordianSaga[s - 1][e - 1].videoLink}`;
    this.text = DischordianSaga[s - 1][e - 1].storyText;
    this.options = DischordianSaga[s - 1][e - 1].storyOptions;
  }
}

export const season = writable<number>(1);
export const episode = writable<number>(11);
export const option = writable<number | null>(null);
export let votingEnded: boolean = true;

export const story = writable<StoryNode | null>(null)

export const lastNodeNumber: number[] = [
  DischordianSaga[0].length,
  DischordianSaga[1].length
] // for each season

function getStoryDate(story: any): string {
  let dateStart: Date = new Date(story.storyDuration[0]);
  let dateEnd: Date = new Date(story.storyDuration[1]);

  let dayStart: string = ("0" + dateStart.getDate()).slice(-2);
  let dayEnd: string = ("0" + dateEnd.getDate()).slice(-2);
  let monthStart: string = ("0" + (dateStart.getMonth() + 1)).slice(-2);
  let monthEnd: string = ("0" + (dateEnd.getMonth() + 1)).slice(-2);
  let yearStart: number = dateStart.getFullYear();
  let yearEnd: number = dateEnd.getFullYear();

  let fullDateStart: string = `${dayStart}.${monthStart}.${yearStart}`;
  let fullDateEnd: string = `${dayEnd}.${monthEnd}.${yearEnd}`;

  let fullDate: string = "Duration: " + fullDateStart + " - " + fullDateEnd;

  let dateNow: Date = new Date();
  votingEnded = dateNow > dateEnd ? true : false;

  return fullDate;
}