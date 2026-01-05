// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccessControlVuln {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // 漏洞：缺少权限控制，任何人都能改 owner
    function setOwner(address newOwner) external {
        owner = newOwner;
    }

    function withdrawAll() external {
        require(msg.sender == owner, "not owner");
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}
