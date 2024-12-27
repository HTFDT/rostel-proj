import { expect } from "chai";
import { ethers } from "hardhat";
import { Bets } from "../typechain-types";

describe("Bets Contract", function () {
    let bets: Bets;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        const BetsFactory = await ethers.getContractFactory("Bets");
        bets = (await BetsFactory.deploy(owner.address)) as Bets;
        await bets.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await bets.owner()).to.equal(owner.address);
        });

        it("Should initialize betsAllowed to false", async function () {
            expect(await bets.betsAllowed()).to.equal(false);
        });
    });

    describe("ResetBets", function () {
        it("Should set new bet names and reset counts", async function () {
            await bets.resetBets("Team A", "Team B");
            expect(await bets.betName1()).to.equal("Team A");
            expect(await bets.betName2()).to.equal("Team B");
            expect(await bets.betsCount1()).to.equal(1);
            expect(await bets.betsCount2()).to.equal(1);
            expect(await bets.betsAllowed()).to.equal(true);
        });

        it("Should only allow the owner to reset bets", async function () {
            await expect(bets.connect(addr1).resetBets("Team A", "Team B"))
                .to.be.revertedWith("Not the owner");
        });
    });

    describe("Betting", function () {
        beforeEach(async () => {
            await bets.resetBets("Team A", "Team B");
        });

        it("Should allow a user to place a bet", async function () {
            await bets.connect(addr1).bet("Team A");
            expect(await bets.betsCount1()).to.equal(2);
            expect(await bets.cache(addr1.address)).to.equal(true);
        });

        it("Should not allow betting on non-existent team", async function () {
            await expect(bets.connect(addr1).bet("Team C"))
                .to.be.revertedWith("No such bet");
        });

        it("Should only allow users to bet when allowed", async function () {
            await bets.pickWinner();
            await expect(bets.connect(addr1).bet("Team A"))
                .to.be.revertedWith("Bets currently not allowed");
        });

        it("Should not allow a user to bet twice", async function () {
            await bets.connect(addr1).bet("Team A");
            await expect(bets.connect(addr1).bet("Team A"))
                .to.be.revertedWith("Already bet");
        });
    });

    describe("Picking Winner", function () {
        beforeEach(async () => {
            await bets.resetBets("Team A", "Team B");
            await bets.connect(addr1).bet("Team A");
            await bets.connect(addr2).bet("Team B");
        });

        it("Should pick a winner and disable betting", async function () {
            await bets.pickWinner();
            expect(await bets.betsAllowed()).to.equal(false);
            const lastWinner = await bets.lastWinner();
            expect(lastWinner === "Team A" || lastWinner === "Team B").to.be.true;
        });

        it("Should only allow the owner to pick a winner", async function () {
            await expect(bets.connect(addr1).pickWinner())
                .to.be.revertedWith("Not the owner");
        });
    });

    describe("Get Winner", function () {
        beforeEach(async () => {
            await bets.resetBets("Team A", "Team B");
        });

        it("Should revert if winner has not been picked", async function () {
            await expect(bets.getWinner())
                .to.be.revertedWith("Winner is not picked");
        });

        it("Should return the last winner after picking", async function () {
            await bets.connect(addr1).bet("Team A");
            await bets.pickWinner();
            const winner = await bets.getWinner();
            expect(winner === "Team A" || winner === "Team B").to.be.true;
        });
    });

    describe("Get current bets", function () {
        beforeEach(async () => {
            await bets.resetBets("Team A", "Team B");
        });

        it("Should return current bet names and coefficients", async function () {
            const [bet1, coef1, bet2, coef2] = await bets.getCurrentBets();
            expect(bet1).to.equal("Team A");
            expect(bet2).to.equal("Team B");
            expect(coef1).to.be.a("string");
            expect(coef2).to.be.a("string");
        });

        it("Should revert if bets are not allowed", async function () {
            await bets.pickWinner();
            await expect(bets.getCurrentBets())
                .to.be.revertedWith("Bets currently not allowed");
        });
    });
});
