import { writable } from "svelte/store"
import DischordianSaga from "../data/DischordianSaga.ts"


export let _season = writable<number>(1);
export let _episode = writable<number>(null);
export let _option = writable<number>(null);
export let isEnded = writable<boolean>(true);

export const lastNodeNumber: number[] = [
  DischordianSaga[0].length,
  DischordianSaga[1].length
] // for each season