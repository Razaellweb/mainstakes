const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Web3 = require("web3");
// http provider configuration

const web3 = createAlchemyWeb3(
    "https://eth-mainnet.g.alchemy.com/v2/JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G"
);
// abi of pancakeswap master chef contract
const shibaSwapMasterChefV2abi = require("./Mainstaking.json");

// contract address of pancakeswap master chef contract
const shibaSwapMasterChefV2address =
    "0xB4a81261b16b92af0B9F7C4a83f1E885132D81e4";
//  master chef contract
const mainStacking = new web3.eth.Contract(
    shibaSwapMasterChefV2abi,
    shibaSwapMasterChefV2address
);

// abi of tokenpair contract
const shibaSwapLpToken = require("./ShibaSwapLPToken.json");
const tokenabi = require("./token.json");

async function getUserActivity(userAddress) {
    try {
        const userBalance = await mainStacking.methods
            .balanceOf(userAddress)
            .call();

        const TotalSupply = await mainStacking.methods
            .totalSupply()
            .call();

        const TotalLiquidity = await mainStacking.methods
            .shib()
            .call();

        const TotalBalance = await mainStacking.methods
            .balanceOf(shibaSwapMasterChefV2address)
            .call();

        const decimal = await mainStacking.methods
            .decimals()
            .call();
        console.log(userBalance / 10 ** decimal)
        console.log(TotalSupply / 10 ** decimal)
        console.log(TotalBalance / 10 ** decimal)
       console.log(((userBalance/10**decimal)/(TotalSupply*10**decimal)) * TotalBalance/10**decimal)
    } catch (error) {
        console.log(error);
    }
}

getUserActivity("0x1e615ad14822b150b309be81b0e2de689655acd7");
