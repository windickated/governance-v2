import { writable } from 'svelte/store';

export const activeTab = writable<Tab>(null);

export const showModal = writable<boolean>(false);
