//
// This script executes when you run 'yarn test'
//

import { ethers } from "hardhat";
import { expect } from "chai";
import { YourCollectible } from "../typechain-types";

const snarkProof = {
  Proof: {
    Ar: {
      X: "18511397317135860462760615697055881505251117594173052169098838185184242829499",
      Y: "7836285815589281294473432517441627938723010171826864208289230571135020232315",
    },
    Krs: {
      X: "20501330605419376101841956635568607505683951705604137462580173172641435578690",
      Y: "12739930800530994336274180855052562781474317774934927608921911047842805768916",
    },
    Bs: {
      X: {
        A0: "511029904203961912745563730849136897674875773261787232746309206679025428306",
        A1: "14031027448970783438362072697755309527914506289152578869458637733410918747312",
      },
      Y: {
        A0: "17510106757183071371879831882424356547146772775325373741583073493506190456019",
        A1: "2664255899462824678726608568125273411520295974189493257442937842858637863850",
      },
    },
    Commitments: [
      {
        X: "442409275124517695491654086120926284874017886406058765587940078519415065055",
        Y: "8629246714849072557241836257649555239602955733566475710751867067459627926648",
      },
    ],
    CommitmentPok: {
      X: "10866165877791240918155615689099366568773576223249843519389669861475591743826",
      Y: "9936440560852896818956564468028310419303015630192798592898912957593629276741",
    },
  },
  PublicWitness: [
    "5257784745499106619736051630271877456719847926971331763699661871455477003127",
    "9580830379332988995386837954371331603112435527392585037944207864327143152818",
  ],
};

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

describe("🚩 Challenge 0: 🎟 Simple NFT Example 🤓", function () {
  let myContract: YourCollectible;

  describe("YourCollectible", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder.
      contractArtifact = `contracts/download-${contractAddress}.sol:YourCollectible`;
    } else {
      contractArtifact = "contracts/YourCollectible.sol:YourCollectible";
    }

    it("Should deploy the contract", async function () {
      const YourCollectible = await ethers.getContractFactory(contractArtifact);
      myContract = await YourCollectible.deploy();
      console.log("\t", " 🛰  Contract deployed on", await myContract.getAddress());
    });

    describe("mintItem()", function () {
      it("Should be able to mint an NFT", async function () {
        const [owner] = await ethers.getSigners();

        console.log("\t", " 🧑‍🏫 Tester Address: ", owner.address);

        const startingBalance = await myContract.balanceOf(owner.address);
        console.log("\t", " ⚖️ Starting balance: ", Number(startingBalance));

        console.log("\t", " 🔨 Minting...");
        const { proof, input, proofCommitment } = generateReceipt();
        const mintResult = await myContract.mintItem(
          owner.address,
          "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr",
          proof,
          input,
          proofCommitment,
        );
        console.log("\t", " 🏷  mint tx: ", mintResult.hash);

        console.log("\t", " ⏳ Waiting for confirmation...");
        const txResult = await mintResult.wait();
        expect(txResult?.status).to.equal(1);

        console.log("\t", " 🔎 Checking new balance: ", Number(startingBalance));
        expect(await myContract.balanceOf(owner.address)).to.equal(startingBalance + 1n);
      });

      it("Should track tokens of owner by index", async function () {
        const [owner] = await ethers.getSigners();
        const startingBalance = await myContract.balanceOf(owner.address);
        const token = await myContract.tokenOfOwnerByIndex(owner.address, startingBalance - 1n);
        expect(token).to.greaterThan(0);
      });
    });
  });
});
