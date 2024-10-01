"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import snarkProof from "~~/snark_proof_with_public_inputs.json";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import nftsMetadata from "~~/utils/simpleNFT/nftsMetadata";

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: tokenIdCounter } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
  });

  type Receipt = {
    proof: Proof;
    input: [bigint, bigint];
    proofCommitment: [bigint, bigint];
  };

  type Proof = {
    a: {
      X: bigint;
      Y: bigint;
    };
    b: {
      X: [bigint, bigint];
      Y: [bigint, bigint];
    };
    c: {
      X: bigint;
      Y: bigint;
    };
  };

  const generateReceipt = (): Receipt => {
    var input: [bigint, bigint] = [0n, 0n];
    input[0] = BigInt(snarkProof.PublicWitness[0]);
    input[1] = BigInt(snarkProof.PublicWitness[1]);

    let proof: Proof = { a: { X: 0n, Y: 0n }, b: { X: [0n, 0n], Y: [0n, 0n] }, c: { X: 0n, Y: 0n } };
    proof.a.X = BigInt(snarkProof.Proof.Ar.X);
    proof.a.Y = BigInt(snarkProof.Proof.Ar.Y);

    proof.b.X[0] = BigInt(snarkProof.Proof.Bs.X.A0);
    proof.b.X[1] = BigInt(snarkProof.Proof.Bs.X.A1);
    proof.b.Y[0] = BigInt(snarkProof.Proof.Bs.Y.A0);
    proof.b.Y[1] = BigInt(snarkProof.Proof.Bs.Y.A1);

    proof.c.X = BigInt(snarkProof.Proof.Krs.X);
    proof.c.Y = BigInt(snarkProof.Proof.Krs.Y);

    let proofCommitment: [bigint, bigint] = [0n, 0n];
    proofCommitment[0] = BigInt(snarkProof.Proof.Commitments[0].X);
    proofCommitment[1] = BigInt(snarkProof.Proof.Commitments[0].Y);

    return { proof, input, proofCommitment };
  };

  const handleMintItem = async () => {
    // circle back to the zero item if we've reached the end of the array
    if (tokenIdCounter === undefined) return;

    const tokenIdCounterNumber = Number(tokenIdCounter);
    const currentTokenMetaData = nftsMetadata[tokenIdCounterNumber % nftsMetadata.length];
    const notificationId = notification.loading("Uploading to IPFS");
    try {
      const uploadedItem = await addToIPFS(currentTokenMetaData);
      const { proof, input, proofCommitment } = generateReceipt();

      // First remove previous loading notification and then show success notification
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, uploadedItem.path, proof, input, proofCommitment],
      });
    } catch (error) {
      notification.remove(notificationId);
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">My NFTs</span>
          </h1>
        </div>
      </div>
      <div className="flex justify-center">
        {!isConnected || isConnecting ? (
          <RainbowKitCustomConnectButton />
        ) : (
          <button className="btn btn-secondary" onClick={handleMintItem}>
            Mint NFT
          </button>
        )}
      </div>
      <MyHoldings />
    </>
  );
};

export default MyNFTs;
