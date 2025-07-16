import { BrowserProvider, type Provider } from "ethers";
import {
  darkTheme,
  getDefaultConfig,
  ConnectButton,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { base } from 'wagmi/chains';

import '@rainbow-me/rainbowkit/styles.css';

import { walletAddress, username, userProvider } from '@stores/auth.ts';
import { potentials, getNFTs } from "@stores/NFTs.ts";
import { storyNodes, get_nodes, activeEpisode, season, episode } from "@stores/storyNode.ts";

const Web3Provider = ({ children }: any) => {
  const config = getDefaultConfig({
    appName: 'Degenerous DAO',
    appIcon: 'https://media.degenerousdao.com/assets/logo.png',
    appUrl: 'https://degenerousdao.com',
    projectId: '0b8a3fac6220753a719b9aeceb8f19fb',
    chains: [base],
    ssr: false, // If your dApp uses server side rendering (SSR)
  });

  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          coolMode
          modalSize="wide"
          theme={darkTheme({
            accentColor: 'rgb(51, 226, 230)',
            accentColorForeground: 'rgb(51, 226, 230)',
            borderRadius: 'large',
            fontStack: 'rounded',
            overlayBlur: 'large',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const RainbowConnect = () => {
  return (
    <Web3Provider>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;
          
          const userAccount = useAccount();
          if (userAccount.status == 'connected') {
            const { address, connector }  = userAccount;
            userProvider.subscribe((res) => {
              if (res) return;
              console.log('Connected: ' + address); //
              walletAddress.set(address);
              username.set(address.slice(0, 6) + "..." + address.slice(address.length - 4));
              connector.getProvider().then((provider: any) => {
                userProvider.set(new BrowserProvider(provider, "any") as Provider);
                getNFTs();
                console.log(provider); //
                const episodeStorage = localStorage.getItem("activeEpisode");
                if (episodeStorage) {
                  const { seasonNr } = JSON.parse(episodeStorage);
                  season.set(seasonNr);
                  console.log("Active episode: " + episodeStorage); //
                }
                get_nodes().then((nodes) => {
                  storyNodes.set(nodes)
                  if (episodeStorage) {
                    const { episodeNr } = JSON.parse(episodeStorage);
                    if (nodes.length >= episodeNr) episode.set(episodeNr);
                  }
                });
              });
            })
          } else if (userAccount.status == 'disconnected' && !connected) {
            walletAddress.subscribe((address) => {
              if (address) location.reload();
            });
          }
          
          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                    >
                      <p className="sign-lable">Sign in</p>
                    </button>
                  );
                }
                if (chain.unsupported) {
                  return (
                    <button onClick={openChainModal} type="button">
                      Wrong network
                    </button>
                  );
                }
                return (
                  <button onClick={openAccountModal} type="button">
                    Sign out
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </Web3Provider>
  );
};

export default RainbowConnect;
