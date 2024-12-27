//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

// contract for betting
contract Bets {
    address public immutable owner;
    string public betName1;
    string public betName2;
    uint public betsCount1;
    uint public betsCount2;
    mapping(address => bool) public cache;
    address[] public keys;
    bool public betsAllowed;
    string public lastWinner;

    constructor(address _owner) {
        owner = _owner;
    }

    // modifier to check if sender is the owner of the contract
    modifier isOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier isBetsAllowed() {
        require(betsAllowed, "Bets currently not allowed");
        _;
    }

    // gets current status of bets
    // if owner didn't reset bets after picking winner of the last round bets are not allowed
    function getCurrentBets() external view isBetsAllowed() returns (string memory bet1, string memory coef1, string memory bet2, string memory coef2) {
        uint a1 = betsCount1 * 100 / betsCount2;
        uint a2 = betsCount2 * 100 / betsCount1;
        bet1 = betName1;
        bet2 = betName2;
        // computing coefficients only using the nubmer of bets for each team
        coef1 = string.concat(uint2str(1 + a2 / 100, 0), string.concat(".", uint2str(a2 % 100, 2)));
        coef2 = string.concat(uint2str(1 + a1 / 100, 0), string.concat(".", uint2str(a1 % 100, 2)));
    }

    // resets status by setting new bets
    function resetBets(string memory bet1, string memory bet2) external isOwner() {
        betName1 = bet1;
        betName2 = bet2;
        betsCount1 = 1;
        betsCount2 = 1;
        // also allows to bet and get current status
        betsAllowed = true;
        // clears cache of already bet addresses from the last round
        for (uint i = 0; i < keys.length; i++) {
            delete cache[keys[i]];
        }
        delete keys;
    }

    // picks winner and ends the current round of the bets
    function pickWinner() external isOwner() {
        uint s = betsCount1 + betsCount2;
        uint r = random();
        lastWinner = s * r <= betsCount1 * 1000 ? betName1 : betName2;
        betsAllowed = false;
    }

    // allows users to bet only once per round
    function bet(string memory _betName) external isBetsAllowed() {
        require(compareStrings(_betName, betName1) || compareStrings(_betName, betName2), "No such bet");
        require(!cache[msg.sender], "Already bet");

        if (compareStrings(_betName, betName1))
            betsCount1 += 1;
        else
            betsCount2 += 1;

        cache[msg.sender] = true;
        keys.push(msg.sender);
    }

    // returns the winner of the last round
    function getWinner() external view returns (string memory) {
        require(!betsAllowed, "Winner is not picked");
        return lastWinner;
    }

    // compares strings using hashes
    function compareStrings(string memory str1, string memory str2) private pure returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }

    // uses pseudo random to get the number between 0 and 1000
    function random() private view returns (uint) {
        uint randNonce = 0;
        uint randomHash = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce)));
        return randomHash % 1000;
    }

    // converts int to string and also pads the resulting string with zeroes to the given length
    function uint2str(uint _i, uint8 _padTo) private pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        uint m = _padTo > len ? _padTo : len;
        bytes memory bstr = new bytes(m);
        uint k = m;
        while (k > 0) {
            k = k - 1;
            if (_i == 0) {
                bstr[k] = bytes1(uint8(48));
            }
            uint8 temp = (48 + uint8(_i % 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
            if (_padTo > 0)
                _padTo = _padTo - 1;
        }
        return string(bstr);
    }
}