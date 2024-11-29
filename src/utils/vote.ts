import { episode, selectedOption } from "../stores/storyNode";
import { potentials, NFT, selectedNFTs } from "../stores/NFTs";
import handleOptions from "../utils/options.ts";
import { contract } from "../lib/contract";

let _episode: number;
let _option: number | null;
let _potentials: NFT[];
let _selectedNFTs: NFT[];

episode.subscribe((nr) => _episode = nr);
selectedOption.subscribe((nr) => _option = nr);
potentials.subscribe((arr) => _potentials = arr);
selectedNFTs.subscribe((arr) => _selectedNFTs = arr);

export default async function vote() {
  if (_selectedNFTs.length == 1) {
    const potentialNumber: number = _selectedNFTs[0].id;
    await (
      await contract()
    ).singleVote(_episode, potentialNumber, _option);
  } else {
    const potentialNumbers: number[] = [];
    _selectedNFTs.map((nft: NFT) => {
      potentialNumbers.push(nft.id);
    });
    const options: number[] = new Array(potentialNumbers.length).fill(
      _option
    );
    await (await contract()).batchVote(_episode, potentialNumbers, options);
  }
  // reset Options & NFT tiles
  handleOptions.reset(null);
  _potentials.map(async (potential) => {
    if (potential.selected) {
      potential.selected = false;
    }
  })
  selectedNFTs.set([]);
  potentials.set(_potentials);
}