import { writable } from 'svelte/store';
import { type Provider } from 'ethers';

export const walletAddress = writable<string>('');
export const username = writable<string>('');
export const userProvider = writable<Provider | null>(null);
