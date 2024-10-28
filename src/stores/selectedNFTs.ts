import { writable } from "svelte/store"

export let _potentials = writable([]);
export let _inactivePotentials = writable([]);