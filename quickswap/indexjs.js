const { Alchemy, Network } = require("alchemy-sdk")
const Web3 = require('web3');

const settings = {
  apiKey: "JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G", // Replace with your Alchemy API Key.
  network: Network.MATIC_MAINNET
};
const alchemy = new Alchemy(settings);

const providerUrl = "https://rpc-mainnet.maticvigil.com/";
const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
//const web3 = new Web3(alchemy.websocketProvider);

const QuickSwapABI = require('./MasterChefV2.json');
const tokenABI = require('./token.json');

const uniqueTransactions = new Set();

async function foo(userAddress) {
  const res = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    toBlock: "latest",
    toAddress: userAddress,
    excludeZeroValue: true,
    category: ["erc20"],
    order: "desc",
  });


  for (let i = 0; i < res.transfers.length; i++) {
    if (!uniqueTransactions.has(res.transfers[i].rawContract.address)) {
      if (res.transfers[i].asset == "UNI-V2") {
        uniqueTransactions.add(res.transfers[i].rawContract.address);
        const QuickSwapRouter = new web3.eth.Contract(QuickSwapABI, res.transfers[i].rawContract.address);
        const Balance = await QuickSwapRouter.methods.balanceOf(userAddress).call()
        const reserve = await QuickSwapRouter.methods.getReserves().call();
        const tokenDeC = await QuickSwapRouter.methods.decimals().call();
        const token0 = await QuickSwapRouter.methods.token0().call();
        const token1 = await QuickSwapRouter.methods.token1().call();
        const token0Contract = new web3.eth.Contract(tokenABI, token0);
        const token1Contract = new web3.eth.Contract(tokenABI, token1);
        const token0Dec = await token0Contract.methods.decimals().call();
        const token0Symbol = await token0Contract.methods.symbol().call();

        const token1Dec = await token1Contract.methods.decimals().call();
        const token1Symbol = await token1Contract.methods.symbol().call();




        const reserve0 = reserve._reserve0;
        const reserve1 = reserve._reserve1;
        const totalSupply = await QuickSwapRouter.methods.totalSupply().call()

        const token0Amount = ((reserve0 * Balance) / totalSupply) / 10 ** token0Dec
        const token1Amount = ((reserve1 * Balance) / totalSupply) / 10 ** token1Dec

        if (token0Amount == 0 && token1Amount == 0) {

        }
        else {
          console.log(token0Amount + " " + token0Symbol)
          console.log(token1Amount + " " + token1Symbol)
          console.log("")
          console.log("")
        }
      }
    }
  }
}



foo("0xadb2437e6f65682b85f814fbc12fec0508a7b1d0");