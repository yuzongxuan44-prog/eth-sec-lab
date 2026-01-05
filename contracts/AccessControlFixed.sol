// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessControlFixed {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    // 修复：仅 owner 可修改 owner
    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function withdrawAll() external {
        require(msg.sender == owner, "not owner");
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}
