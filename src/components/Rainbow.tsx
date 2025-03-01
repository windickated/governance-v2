import { BrowserProvider } from "ethers";
import {
  darkTheme,
  getDefaultConfig,
  ConnectButton,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

import '@rainbow-me/rainbowkit/styles.css';

import { walletAddress, username, userProvider } from '../stores/auth';
import type { Provider } from 'ethers';

const Web3Provider = ({ children }: any) => {
  const config = getDefaultConfig({
    appName: 'Degenerous DAO',
    appIcon: 'https://media.degenerousdao.com/assets/logo.png',
    appUrl: 'https://degenerousdao.com',
    projectId: '0b8a3fac6220753a719b9aeceb8f19fb',
    chains: [mainnet, polygon, optimism, arbitrum, base],
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
            walletAddress.set(address);
            username.set(address.slice(0, 6) + "..." + address.slice(address.length - 4));
            connector.getProvider().then((provider: any) =>
              userProvider.set(new BrowserProvider(provider, "any") as Provider)
            );
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
                  // <div>
                  //   <button onClick={openChainModal} type="button">
                  //     {chain.hasIcon && (
                  //       <div>
                  //         {chain.iconUrl && (
                  //           <img
                  //             alt={chain.name ?? 'Chain icon'}
                  //             src={chain.iconUrl}
                  //           />
                  //         )}
                  //       </div>
                  //     )}
                  //     {chain.name}
                  //   </button>
                    <button onClick={openAccountModal} type="button">
                      {/* {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''} */}
                      Sign out
                    </button>
                  // </div>
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
