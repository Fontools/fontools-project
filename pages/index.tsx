import { Button, Label, TextInput } from 'flowbite-react';
import { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { ethers } from "ethers";
import { factoryABI, factoryAddress } from "../lib/utils";
import { useForm } from "react-hook-form";

export default function Home() {
  const [account, setAccount] = useState("0x0000");
  const [isConnected, setIsConnected] = useState(false);
  const [msigner, setmsigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [result, setResult] = useState<Result | null>(null);
  const [TokenAddress, setTokenAddress] = useState<string | null>(null);
  const [Creator, setCreator] = useState<string | null>(null);
 

  let provider: any;
  let signer: any;

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: "",
      symbol: "",
      totalSupply: 0,
    },
    mode: "onChange",
  });

  async function connectWallet() {
    if (window.ethereum == null) {
      console.log("MetaMask not installed");
    } else {
      try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const address = await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        setmsigner(signer);
        setAccount(address[0]);

        const contractInstance = new ethers.Contract(
          factoryAddress,
          factoryABI,
          provider
        );
        setContract(contractInstance);

        setIsConnected(true);
      } catch (error) {
        console.log("Error connection...");
        console.log(error);
      }
    }
  }

  async function createToken(values: any) {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }
  
    // Set loading to true before the transaction
    setIsLoading(true);
  
    const contractWithSigner = contract!.connect(msigner!);
  
    const { name, symbol, totalSupply } = values;
  
    try {
      // Send the transaction to create the token
      const tx = await contractWithSigner.createToken(name, symbol, totalSupply);
  
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
  
      // find the TokenCreatedEvent in the transaction receipt
      const tokenCreatedEvent = receipt.events?.find((e: { event: string; }) => e.event === 'TokenCreatedEvent');
      if (tokenCreatedEvent && tokenCreatedEvent.args) {
        const { TokenAddress, Creator, TokenID } = tokenCreatedEvent.args;
        // now you have the token address, creator, and tokenID
        console.log('Token Address:', TokenAddress);
        console.log('Creator:', Creator);
        console.log('Token ID:', TokenID);
        setTokenAddress(TokenAddress);
        setCreator(Creator);
        toast.success(`Token was created successfully. Token Address: ${TokenAddress}`);
      }
  
      // toast.success(`Token was created successfully. Token Address: ${TokenAddress}`);
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Error creating token. Please check the console for details.");
    } finally {
      // Set loading back to false after the transaction is complete
      setIsLoading(false);
    }
  }

  const handleCloseResult = () => {
    // Reset the result states to null when closing
    setTokenAddress(null);
    setCreator(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between py-8">
      <div className="absolute top-6 right-6">
        <Button
          outline={true}
          onClick={connectWallet}
          gradientDuoTone="purpleToBlue"
        >
          {isConnected ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect wallet"}
        </Button>
      </div>

      <h1 className="text-center text-3xl font-bold leading-9 tracking-tight text-sky-800">
        FonTools
      </h1>

      <h3 className="text-center text-l font-bold leading-9 tracking-tight text-sky-800">
        Create your own token on the Fon Network with a few easy steps!
      </h3>

      {TokenAddress ? ( // If TokenAddress exists, show result, else show the form
        <div className="flex flex-col items-center mt-24 my-auto border p-4 gap-4">
          <h2 className="text-xl font-semibold">Congrats! Token Created 🥳</h2>
          <p>Token Address: {TokenAddress}</p>
          <p>Creator: {Creator}</p>
          <Button className= "mt-4" onClick={handleCloseResult}>Close</Button>
        </div>
      ) : (
        <form
          className="flex flex-col my-auto gap-4"
          onSubmit={handleSubmit(createToken)}
        >
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name" value="Token name" />
            </div>

            <TextInput
              id="name"
              type="name"
              placeholder="eg..FonDoge"
              required={true}
              {...register("name", { required: "Enter token name" })}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="symbol" value="Token symbol" />
            </div>

            <TextInput
              id="symbol"
              type="symbol"
              placeholder="FDoge"
              required={true}
              {...register("symbol", { required: "Enter token symbol" })}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="total-supply" value="Token total supply" />
            </div>

            <TextInput
              id="total-supply"
              type="total-supply"
              placeholder="1000000"
              required={true}
              {...register("totalSupply", {
                required: "Enter token total supply",
              })}
            />
          </div>

          {isLoading ? (
            <div className="text-center">Creating token, please wait...</div>
          ) : (
            <Button type="submit">Create token</Button>
          )}
        </form>
      )}

      <Toaster position="top-center" reverseOrder={false} />
    </main>
  );
}
