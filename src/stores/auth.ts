import { writable } from "svelte/store";

export const walletAddress = writable<string>('');
export const username = writable<string>('');
