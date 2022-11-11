import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenSale, MyERC20, MyERC20__factory, MyERC721__factory, TokenSale__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

const TEST_RATIO = 5;

describe("NFT Shop", async () => {
  let accounts: SignerWithAddress[];
  let tokenSaleContract: TokenSale;
  let paymentTokenContract: MyERC20;
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
    tokenSaleContract = await tokenSaleFactory.deploy(TEST_RATIO, paymentTokenContract.address);
    await tokenSaleContract.deployed();
    const MINTER_ROLE = await paymentTokenContract.MINTER_ROLE();
    const roleTx = await paymentTokenContract.grantRole(MINTER_ROLE, tokenSaleContract.address);
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

    beforeEach(async () => {
      buyValue = ethers.utils.parseEther("1");
      ethBalanceBefore = await accounts[1].getBalance();
      const tx = await tokenSaleContract.connect(accounts[1]).buyTokens({value: buyValue});
      await tx.wait();
    });

    it("charges the correct amount of ETH", async () => {
      ethBalanceAfter = await accounts[1].getBalance();
      const diff = ethBalanceBefore.sub(ethBalanceAfter);
      expect(diff).to.eq(buyValue);
    });

    it("gives the correct amount of tokens", async () => {
      const tokenBalance = await paymentTokenContract.balanceOf(accounts[1].address);
      expect(tokenBalance).to.eq(buyValue.div(TEST_RATIO));
    });
  });

  describe("When a user burns an ERC20 at the Token contract", async () => {
    it("gives the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("burns the correct amount of tokens", async () => {
      throw new Error("Not implemented");
    });
  });

  describe("When a user purchase a NFT from the Shop contract", async () => {
    it("charges the correct amount of ETH", async () => {
      throw new Error("Not implemented");
    });

    it("updates the owner account correctly", async () => {
      throw new Error("Not implemented");
    });

    it("update the pool account correctly", async () => {
      throw new Error("Not implemented");
    });

    it("favors the pool with the rounding", async () => {
      throw new Error("Not implemented");
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