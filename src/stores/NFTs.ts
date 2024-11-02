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
    this.active = i === 2 || i === 5 ? false : true; // deactivating some for testing
  }
}

export const potentials = writable<NFT[]>([]);

export const selectedNFTs = writable<NFT[]>([]);
export const inactiveNFTs = writable<NFT[]>([]);

export async function getNFTs() {
  const testNftNumbers = [2, 4, 35, 436, 474, 585, 697]; // temp
  let potentialNFTs: NFT[] = [];
  const metadata: any[] = [];
  for (let i in testNftNumbers) {
    const response = await fetch(
      `https://api.degenerousdao.com/nft/data/${testNftNumbers[i]}`
    );
    metadata[i] = await response.json();
    potentialNFTs[i] = new NFT(metadata, Number(i));
  }
  potentials.set(potentialNFTs);

  setInactiveNFTs(potentialNFTs); // temp
}

const setInactiveNFTs = (NFTs: NFT[]) => {
  let testInactiveNFTs: NFT[] = [];
  NFTs.map(nft => {
    if (!nft.active) testInactiveNFTs.push(nft);
  })
  inactiveNFTs.set(testInactiveNFTs);
}