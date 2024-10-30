import { writable } from 'svelte/store';

export const isLogged = writable<boolean>(false);
