import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ConnectWallet,
  MediaRenderer,
  useAddress,
  useBalance,
  useNetworkMismatch,
  useSDK,
  useSwitchChain,
} from "@thirdweb-dev/react";
import type { NextPage } from "next";
import { CHAIN } from "../const/chains";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Profile, useSearchProfiles } from "@lens-protocol/react-web";
import { useToast } from "@/components/ui/use-toast";
import { ethers } from "ethers";
import { ChevronLeft } from "lucide-react";

const Home: NextPage = () => {
  // Allows us to show messages to user
  const { toast } = useToast();

  // Get connected wallet address
  const address = useAddress();
  // Check if they're on Polygon zkEVM
  const wrongNetwork = useNetworkMismatch();
  // Function to switch chains to Polygon zkEVM
  const switchChain = useSwitchChain();
  // Read the balance of ETH of the connected wallet on Polygon zkEVM
  const { data: balance, isLoading: loadingBalance } = useBalance();

  // Access connected wallet using thirdweb SDK
  const sdk = useSDK();

  // Manage search state with a debounce to hit API when user stops typing
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 500);

  // Search for the Lens profiles that match the search query
  const { data: profiles, loading: loadingProfiles } = useSearchProfiles({
    query: debouncedSearch,
  });

  // Once user selects profile, we'll store it here
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Set the amount to pay
  const [amount, setAmount] = useState<string>("");

  // Loading state while pay transaction is being sent
  const [loadingPay, setLoadingPay] = useState<boolean>(false);

  async function handlePay() {
    setLoadingPay(true);
    const amountBN = ethers.utils.parseEther(amount);

    if (!selectedProfile) {
      toast({
        title: "Invalid Profile selected.",
        description: "Select a valid profile to send payment to.",
        variant: "destructive",
      });
      return;
    }

    if (!amountBN) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to pay.",
        variant: "destructive",
      });
      return;
    }

    // Does user have enough balance to pay?
    if (balance && balance.value.lt(amountBN)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance to pay",
        variant: "destructive",
      });
      return;
    }

    // Try send funds
    try {
      const tx = await sdk?.wallet.transfer(selectedProfile.ownedBy, amount);

      toast({
        title: "Funds sent successfully!",
        description: `Transaction Hash: ${tx?.receipt.transactionHash}`,
      });

      // Clear state
      setSelectedProfile(null);
      setAmount("");
      setSearch("");
    } catch (error) {
      toast({
        title: "An Error Occurred",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPay(false);
    }
  }

  // Ensure the user connect's their wallet and is on Polygon zkEVM
  if (!address || wrongNetwork) {
    return (
      <div className="container max-w-3xl py-16 md:py-24">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mt-2">
          Connect Your Wallet
        </h1>
        <p className="text-sm text-muted-foreground mb-4 mt-4">
          Connect your wallet so we can read your balance and ask you to sign
          transactions.
        </p>

        {!address && <ConnectWallet />}
        {wrongNetwork && (
          <Button onClick={() => switchChain(CHAIN.chainId)}>
            Switch to Polygon zkEVM
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-16 md:py-24">
      {!selectedProfile && (
        <>
          <p className="text-sm text-muted-foreground mb-0">Your Balance</p>

          {!loadingBalance ? (
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mt-2">
              {balance?.displayValue} {balance?.symbol}
            </h1>
          ) : (
            <Skeleton className="w-full h-16 mt-2" />
          )}

          <Separator className="my-4" />

          <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors mt-8">
            Pay Someone
          </h2>

          <Input
            className="w-full h-16 mt-2 mb-2"
            placeholder="Enter a .lens handle"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </>
      )}

      {!selectedProfile && profiles && profiles.length > 0 ? (
        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-8">
          Results
        </h3>
      ) : (
        <div className="h-4" />
      )}

      {!selectedProfile && loadingProfiles
        ? Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-16 mt-2" />
          ))
        : !selectedProfile &&
          profiles?.map((profile) => (
            <div
              key={profile.id}
              className="w-full h-16 mt-2 flex items-center justify-between border my-2 p2 px-4 rounded-md hover:cursor-pointer hover:bg-accent hover:bg-opacity-10 cursor-pointer transition-all"
              role="button"
              onClick={() => setSelectedProfile(profile)}
            >
              <div className="flex items-center">
                <MediaRenderer
                  // @ts-ignore weird lens type issue with images
                  src={profile?.picture?.original?.url || ""}
                  alt={profile.name || profile.handle || ""}
                  height={"40px"}
                  width={"40px"}
                  className="w-10 h-10 rounded-full mr-4"
                />
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.handle}
                  </p>
                </div>
              </div>
            </div>
          ))}

      {selectedProfile && (
        <>
          <div className="flex flex-col">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <ChevronLeft
                className="mx-2 md:-mt-1 -ml-2 md:-ml-10 mb-1 hover:cursor-pointer"
                role="button"
                onClick={() => setSelectedProfile(null)}
              />
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                Pay {selectedProfile?.name || selectedProfile?.handle}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProfile.ownedBy}
            </p>
            <div className="flex flex-col md:flex-row items-center mt-2">
              <Input
                className="w-full h-12 mt-2 mb-2"
                placeholder="Amount to pay in ETH"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <Button
                className="h-11 md:ml-4 min-w-full md:min-w-[128px]"
                onClick={() => handlePay()}
                disabled={loadingPay}
              >
                {loadingPay ? "Paying..." : "Pay"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Your Balance: {balance?.displayValue} {balance?.symbol}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
