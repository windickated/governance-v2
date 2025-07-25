import { get } from 'svelte/store';
import { episode, selectedOption } from '../stores/storyNode';
import { potentials, NFT, selectedNFTs } from '../stores/NFTs';
import { contract } from '../lib/contract';

export default async function vote() {
  const _episode: number = get(episode);
  const _option: number | null = get(selectedOption);
  const _potentials: NFT[] = get(potentials);
  const _selectedNFTs: NFT[] = get(selectedNFTs);

  if (_selectedNFTs.length == 1) {
    const potentialNumber: number = _selectedNFTs[0].id;
    await (await contract()).singleVote(_episode, potentialNumber, _option);
  } else {
    const potentialNumbers: number[] = [];
    _selectedNFTs.map((nft: NFT) => {
      potentialNumbers.push(nft.id);
    });
    const options: number[] = new Array(potentialNumbers.length).fill(_option);
    await (await contract()).batchVote(_episode, potentialNumbers, options);
  }
  // reset Options & NFT tiles
  selectedOption.set(null);
  _potentials.map(async (potential) => {
    if (potential.selected) {
      potential.selected = false;
    }
  });
  selectedNFTs.set([]);
  potentials.set(_potentials);
}
