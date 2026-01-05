// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FirstComeMint {
    uint256 public constant MAX = 1;
    uint256 public minted;

    event Minted(address indexed who, uint256 totalMinted);

    function mint() external {
        require(minted < MAX, "sold out");
        minted += 1;
        emit Minted(msg.sender, minted);
    }
}
