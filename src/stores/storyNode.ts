import { writable } from 'svelte/store';
import { contract } from '../lib/contract.ts';

export const storyNodes = writable<StoryNode[]>([]);
export const loadingStories = writable<number>(-1);
export const activeEpisode = writable<Nullable<ActiveEpisode>>(null);

export const story = writable<StoryNode | null>(null);

export const season = writable<number>(2);
export const episode = writable<number>(-1);
export const selectedOption = writable<number | null>(null);

export const votingResults = writable<Result | null>(null);
export const checkingResults = writable<number>(-1);
export const abortVotingCheck = writable<boolean>(false);

export const get_nodes = async () => {
  const count = await (await contract('alchemy')).getStoryNodesCount();
  const nodes: any[] = [];
  abortVotingCheck.set(true);
  const storyPercent = 100 / Number(count);
  let progress: number = 0;
  loadingStories.set(progress);

  for (let i = 0; i < count; i++) {
    loadingStories.set((progress += storyPercent));
    let ipfs_uri = await (await contract('alchemy')).storyNodeMetadata(i);
    if (ipfs_uri === 'ipfs://QmYutAynNJwoE88LxthGdA2iH8n2CGJygz8ZkoA1WACsNg') {
      ipfs_uri = 'ipfs://QmP2c7vULMkbaChCkUiQ6PDsHLBt3WcSEYax4SSvugbZb1';
    }
    const slicedURI = ipfs_uri.match('ipfs://') ? ipfs_uri.slice(7) : ipfs_uri;
    try {
      // console.log('ipfs URI: https://gateway.pinata.cloud/ipfs/' + slicedURI);
      const json = await fetch(
        `https://gateway.pinata.cloud/ipfs/${slicedURI}`,
      );
      nodes.push(await json.json());
    } catch (error) {
      console.error(error);
      // console.log('ipfs URI: https://ipfs.io/ipfs/' + slicedURI);
      const json = await fetch(`https://ipfs.io/ipfs/${slicedURI}`);
      nodes.push(await json.json());
    }
    const { endTimestamp } = await (await contract('alchemy')).storyNodes(i);
    nodes[nodes.length - 1].endTimestamp = Number(endTimestamp);
    nodes[nodes.length - 1].ended =
      Number(endTimestamp) * 1000 < new Date().getTime();
    nodes[nodes.length - 1].duration = getDuration(endTimestamp.toString());
    if (nodes[nodes.length - 1].season) {
      nodes[nodes.length - 1].image_url =
        `https://img.youtube.com/vi/${nodes[nodes.length - 1].video_url}/hqdefault.jpg`;
    } else {
      nodes[nodes.length - 1].image_url =
        `https://img.youtube.com/vi/${nodes[nodes.length - 1].video_url.split('/')[nodes[nodes.length - 1].video_url.split('/').length - 1].replace('?', '')}/hqdefault.jpg`;
      nodes[nodes.length - 1].episodeName = nodes[nodes.length - 1].title
        ?.replace('The Dischordian Saga: ', '')
        .split(' - Episode ')[0];
      nodes[nodes.length - 1].votes_options.map((opt: { option: string }) => {
        if (opt.option[2] == ' ') opt.option = opt.option.slice(2);
      });
    }
  }

  loadingStories.set(-1);
  return nodes as StoryNode[];
};

function getDuration(timestamp: number): string {
  const dateStart: Date = new Date(
    (Number(timestamp) - 3 * 24 * 60 * 60) * 1000,
  );
  const dateEnd: Date = new Date(Number(timestamp) * 1000);

  const dayStart: string = ('0' + dateStart.getDate()).slice(-2);
  const dayEnd: string = ('0' + dateEnd.getDate()).slice(-2);
  const monthStart: string = ('0' + (dateStart.getMonth() + 1)).slice(-2);
  const monthEnd: string = ('0' + (dateEnd.getMonth() + 1)).slice(-2);
  const yearStart: number = dateStart.getFullYear();
  const yearEnd: number = dateEnd.getFullYear();

  const fullDateStart: string = `${dayStart}.${monthStart}.${yearStart}`;
  const fullDateEnd: string = `${dayEnd}.${monthEnd}.${yearEnd}`;

  const duration: string = fullDateStart + ' - ' + fullDateEnd;

  return duration;
}
