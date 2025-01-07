import { writable } from "svelte/store";
import { provider } from "../lib/ethers";
import { contract } from "../lib/contract";

export class NFT {
  id: number;
  name: string;
  image: string;
  class: string;
  selected: boolean;
  constructor(data: any, i: number) {
    this.id = data[i].name.match(/\d+/)[0];
    this.name = data[i].name;
    this.image = data[i].image;
    this.class = data[i].attributes[5].value;
    this.selected = false;
  }
}

export const potentials = writable<NFT[]>([]);
export const selectedNFTs = writable<NFT[]>([]);
export const listedNumbers = writable<Array<number>>([]);
export const walletAddress = writable<string>('');
export const transactionInfo = writable<string | null>(null);

const message = (address: string): string => { 
return `
Only Potential holders can enter the Galactic Governance Hub!

Sign this message with your wallet
${address}
to prove you're a Potentials NFT holder.

It will not cause a blockchain transaction, nor any gas fees.
`;}

export async function getNFTs() {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  walletAddress.set(address.slice(0, 6) + "..." + address.slice(address.length - 4));
  try {
    transactionInfo.set('Please sign the transaction in your wallet to proceed.');
    await signer.signMessage(message(address));
  } catch (error) {
    transactionInfo.set('The transaction was rejected. Try again if you want to enter.');
    return null;
  }
  transactionInfo.set(null);
  const json = await fetch(
    `https://api.degenerousdao.com/nft/owner/${address}`
  );
  const data = await json.json();
  const nftNumbers = data.ownedNfts.map((nft: any) => +nft.tokenId);
  let potentialNFTs: NFT[] = [];
  const metadata: any[] = [];
  for (let i in nftNumbers) {
    const response = await fetch(
      `https://api.degenerousdao.com/nft/data/${nftNumbers[i]}`
    );
    metadata[Number(i)] = await response.json();
    potentialNFTs[Number(i)] = new NFT(metadata, Number(i));
  }
  potentials.set(potentialNFTs);

  let listedNFTs: number[];
  const options = {
    method: 'GET',
    headers: {accept: 'application/json', 'x-api-key': 'c6a6c088d5e34ca2a018f44673697f01'}
  };
  await fetch('https://api.opensea.io/api/v2/listings/collection/potentials-eth/all', options)
    .then(res => res.json())
    .then(res => {
      listedNFTs = res.listings.map((listing: any) => listing.protocol_data.parameters.offer[0].identifierOrCriteria);
      listedNumbers.set(Array.from(new Set(listedNFTs)));
    })
    .catch(err => console.error(err));
}

export const nftVote = async (episodeNr: number, nftNr: number) => {
  if (episodeNr === -1) return;
  return await (await contract()).getVoteOptionId(episodeNr, nftNr);
}