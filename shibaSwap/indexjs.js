const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3("https://eth-mainnet.g.alchemy.com/v2/JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G");

// abi of pancakeswap master chef contract
const ShibaSwapMainstakingabi = require("./Mainstaking.json");

async function getUserActivity(userAddress) {
    try {
        const xShib =
            "0xB4a81261b16b92af0B9F7C4a83f1E885132D81e4";

        const xShibContract = new web3.eth.Contract(
            ShibaSwapMainstakingabi,
            xShib
        );

        const xShibAmount = await xShibContract.methods.balanceOf(userAddress).call();
        const xShibDec = await xShibContract.methods.decimals().call();
        const xShibSymbol = await xShibContract.methods.symbol().call();


        if (xShibAmount !== 0) {
            console.log(xShibAmount / 10 ** xShibDec + " " + xShibSymbol)
        }

        const bone =
            "0xf7A0383750feF5AbaCe57cc4C9ff98e3790202b3";

        const boneContract = new web3.eth.Contract(
            ShibaSwapMainstakingabi,
            bone
        );

        const boneAmount = await boneContract.methods.balanceOf(userAddress).call();
        const boneDec = await boneContract.methods.decimals().call();
        const boneSymbol = await boneContract.methods.symbol().call();

        if (boneAmount != 0) {
            console.log(boneAmount / 10 ** boneDec + " " + boneSymbol)
        }

        const leash =
            "0xa57D319B3Cf3aD0E4d19770f71E63CF847263A0b";

        const leashContract = new web3.eth.Contract(
            ShibaSwapMainstakingabi,
            leash
        );

        const leashAmount = await leashContract.methods.balanceOf(userAddress).call();
        const leashDec = await leashContract.methods.decimals().call();
        const leashSymbol = await leashContract.methods.symbol().call();


        if (leashAmount != 0) {
            console.log(leashAmount / 10 ** leashDec + " " + leashSymbol)
        }

    } catch (error) {
        console.log(error);
    }
}

getUserActivity("0xf977814e90da44bfa03b6295a0616a897441acec")
