import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenSale, MyERC20, MyERC721, MyERC20__factory, MyERC721__factory, TokenSale__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

const TEST_RATIO = 5;
const NFT_PRICE = ethers.utils.parseEther(".1");

describe("NFT Shop", async () => {
  let accounts: SignerWithAddress[];
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20;
  let nftContract: MyERC721;
  let erc20ContractFactory: MyERC20__factory;
  let erc721ContractFactory: MyERC721__factory;
  let tokenSaleFactory: TokenSale__factory;

  beforeEach(async () => {
    [
      accounts,
      erc20ContractFactory, 
      erc721ContractFactory, 
      tokenSaleFactory
    ] = await Promise.all([ 
      ethers.getSigners(),
      ethers.getContractFactory("MyERC20"),
      ethers.getContractFactory("MyERC721"),
      ethers.getContractFactory("TokenSale"),
    ]);
    paymentTokenContract = await erc20ContractFactory.deploy();
    await paymentTokenContract.deployed();
    nftContract = await erc721ContractFactory.deploy();
    await nftContract.deployed();
    tokenSaleContract = await tokenSaleFactory.deploy(TEST_RATIO, NFT_PRICE, paymentTokenContract.address, nftContract.address);
    await tokenSaleContract.deployed();
    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    const roleTx = await paymentTokenContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await roleTx.wait();
    const roleTx2 = await nftContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
    await roleTx2.wait();

  });

  describe("When the Shop contract is deployed", async () => {
    it("defines the ratio as provided in parameters", async () => {
      const ratio = await tokenSaleContract.ratio();
      expect(ratio).to.eq(TEST_RATIO);
    });

    it("uses a valid ERC20 as payment token", async () => {
      const paymentAddress = await tokenSaleContract.paymentToken();
      const paymentContract = erc20ContractFactory.attach(paymentAddress);
      await expect(paymentContract.balanceOf(accounts[0].address)).not.to.be.reverted;
      await expect(paymentContract.totalSupply()).not.to.be.reverted
    });
  });

  describe("When a user purchase an ERC20 from the Token contract", async () => {
    let buyValue: BigNumber;
    let ethBalanceBefore: BigNumber;
    let ethBalanceAfter: BigNumber;
    let gasCosts: BigNumber;

    beforeEach(async () => {
      buyValue = ethers.utils.parseEther("1");
      ethBalanceBefore = await accounts[1].getBalance();
      const tx = await tokenSaleContract.connect(accounts[1]).buyTokens({value: buyValue});
      const txReceipt = await tx.wait();
      const gasUsed = txReceipt.gasUsed;
      const pricePerGas = txReceipt.effectiveGasPrice;
      gasCosts =  gasUsed.mul(pricePerGas);
    });

    it("charges the correct amount of ETH", async () => {
      ethBalanceAfter = await accounts[1].getBalance();
      const diff = ethBalanceBefore.sub(ethBalanceAfter);
      const expectedDifference = buyValue.add(gasCosts);
      const error = diff.sub(expectedDifference);
      expect(error).to.eq(0);
    });

    it("gives the correct amount of tokens", async () => {
      const tokenBalance = await paymentTokenContract.balanceOf(accounts[1].address);
      expect(tokenBalance).to.eq(buyValue.div(TEST_RATIO));
    });

    describe("When a user burns an ERC20 at the Token contract", async () => {
      beforeEach(async () => {
        const expectedBalance = buyValue.div(TEST_RATIO);
        const allowTx = await paymentTokenContract.connect(accounts[1]).approve(tokenSaleContract.address, expectedBalance);
        await allowTx.wait();
        const burnTx = await tokenSaleContract.connect(accounts[1]).returnTokens(expectedBalance);
        await burnTx.wait();
      });

      it("gives the correct amount of ETH", async () => {
        const expectedBalance = buyValue.div(TEST_RATIO);
        const tx = await paymentTokenContract.connect(accounts[1]).transfer(tokenSaleContract.address, buyValue.div(TEST_RATIO));
        await tx.wait();

      });
  
      it("burns the correct amount of tokens", async () => {
        const balanceAfterBurn = await paymentTokenContract.balanceOf(accounts[1].address);
        expect(balanceAfterBurn).to.eq(0);
      });
    });
    describe("When a user purchase a NFT from the Shop contract", async () => {
      beforeEach(async () => {
        const allowTx = await paymentTokenContract.connect(accounts[1]).approve(tokenSaleContract.address, NFT_PRICE);
        await allowTx.wait();
        const mintTx = await tokenSaleContract.connect(accounts[1]).buyNFT(0);
        await mintTx.wait();
      })
      it("charges the correct amount of ETH", async () => {
        throw new Error("Not implemented");
      });
  
      it("updates the owner account correctly", async () => {
        const nftOwner = await nftContract.ownerOf(0);
        expect(nftOwner).to.eq(accounts[1].address);
      });
  
      it("update the pool account correctly", async () => {
        throw new Error("Not implemented");
      });
  
      it("favors the pool with the rounding", async () => {
        throw new Error("Not implemented");
      });
    });
  });


  describe("When a user burns their NFT at the Shop contract", async () => {
    it("gives the correct amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });
    it("updates the pool correctly", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When the owner withdraw from the Shop contract", async () => {
    it("recovers the right amount of ERC20 tokens", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner account correctly", async () => {
      throw new Error("Not implemented");
    });
  });
});