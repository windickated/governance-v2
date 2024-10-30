import { writable } from "svelte/store"

export class NFT {
  id: number;
  name: string;
  image: string;
  class: string;
  selected: boolean;
  active: boolean;
  constructor(data: any, i: number) {
    this.id = data[i].name.match(/\d+/)[0];
    this.name = data[i].name;
    this.image = data[i].image;
    this.class = data[i].attributes[5].value;
    this.selected = false;
    this.active = true;
  }
}

export let potentials = writable<NFT[]>([]);

export let selectedNFTs = writable<NFT[]>([]);
export let inactiveNFTs = writable<NFT[]>([]);