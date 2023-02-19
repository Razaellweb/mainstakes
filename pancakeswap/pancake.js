const Web3 = require("web3");
const axios = require("axios");

// http provider configuration
const url =
  "https://bold-black-energy.bsc.discover.quiknode.pro/c2bf115e5d95e1ee7a40bef1eb2e9bef41222bfb/";
const web3 = new Web3(new Web3.providers.HttpProvider(url));

// abi of pancakeswap master chef contract
const contractabi = require("./pancake.json");

// contract address of pancakeswap master chef contract
const masterChefV2abi = "0xa5f8C5Dbd5F286960b9d90548680aE5ebFf07652";

// create an instance of the master chef contract
const masterChefV2 = new web3.eth.Contract(contractabi, masterChefV2abi);

// abi of lptoken contract
const lpABI = require("./lp.json");
// abi of stablelp contract
const stableabi = require("./stable.json");
// abi of tokens contract
const tokenabi = require("./token.json");
// object file containing 4 pancakestable lp
const pancakeswapstable = require("./pancakestable");

async function getUserActivity(userAddress) {

  try {
    const poolLength = await masterChefV2.methods.poolLength().call();
    // loop through all pool IDs
    for (let i = 0; i <= poolLength; i++) {
      const lpTokenAddress = await masterChefV2.methods.lpToken(i).call();
      const lpTokenContract = new web3.eth.Contract(lpABI, lpTokenAddress);
      const stableContract = new web3.eth.Contract(stableabi, lpTokenAddress);
      try {
        const token0 = await lpTokenContract.methods.token0().call();
        const token1 = await lpTokenContract.methods.token1().call();

        const token0symbol = await new web3.eth.Contract(
          tokenabi,
          token0
        ).methods
          .symbol()
          .call();
        const token1symbol = await new web3.eth.Contract(
          tokenabi,
          token1
        ).methods
          .symbol()
          .call();

        // get the user's information for the current LP token

        const userInfo = await masterChefV2.methods
          .userInfo(i, userAddress)
          .call();
        const poolInfo = await masterChefV2.methods
          .poolInfo(i)
          .call();

        const rewards = await masterChefV2.methods
          .pendingCake(i, userAddress)
          .call();
        // check if the user has 0 amount for the current LP token
        if (userInfo.amount !== "0") {
          // console.log(poolInfo)
         
          const reserve = await lpTokenContract.methods.getReserves().call();
          const token0dec = await lpTokenContract.methods.decimals().call();
          const token1dec = await lpTokenContract.methods.decimals().call();
          const totalSupply = await lpTokenContract.methods.totalSupply().call();

          const reserve0 = reserve._reserve0
          const reserve1 = reserve._reserve1

          const token0Amount = (((reserve0 * userInfo.amount) / totalSupply) / 10 ** token0dec).toFixed(2);
          const token1Amount = (((reserve1 * userInfo.amount) / totalSupply) / 10 ** token1dec).toFixed(2);

          console.log(`Token0 is ${token0symbol}: ${token0Amount}`);
          console.log(`Token1 is ${token1symbol}: ${token1Amount}`);
          console.log(`Rewards is ${rewards/10 ** token0dec}`)
        }
      } catch (error) {
        // check if the lptoken contract has minter function
        try {
          const token0 = pancakeswapstable[i].token0;
          const token1 = pancakeswapstable[i].token1;
          const token0symbol = await new web3.eth.Contract(
            stableabi,
            token0
          ).methods
            .symbol()
            .call();
          const token1symbol = await new web3.eth.Contract(
            stableabi,
            token1
          ).methods
            .symbol()
            .call();

          // get the user's information for the current LP token
          const userInfo = await masterChefV2.methods
            .userInfo(i, userAddress)
            .call();
          //rewards
          const rewards = await masterChefV2.methods
            .pendingCake(i, userAddress)
            .call();
          // check if the user has 0 amount for the current LP token
          if (userInfo.amount !== "0") {
            
            const reserve = await lpTokenContract.methods.getReserves().call();
            const token0dec = await lpTokenContract.methods.decimals().call();
            const token1dec = await lpTokenContract.methods.decimals().call();
            const totalSupply = await lpTokenContract.methods.totalSupply().call();
  
            const reserve0 = reserve._reserve0
            const reserve1 = reserve._reserve1
  
            const token0Amount = (((reserve0 * userInfo.amount) / totalSupply) / 10 ** token0dec).toFixed(2);
            const token1Amount = (((reserve1 * userInfo.amount) / totalSupply) / 10 ** token1dec).toFixed(2);
  
            console.log(`Token0 is ${token0symbol}: ${token0Amount}`);
            console.log(`Token1 is ${token1symbol}: ${token1Amount}`);
            console.log(`Rewards is ${rewards/10 ** token0dec}`)
          
          }
        } catch (error) {
          // console.log(`poolid: ${i} Pool Address: ${lpTokenAddress} does not have factory or minter function`);
          const symbol = await lpTokenContract.methods.symbol().call();
          // get the user's information for the current LP token
          const userInfo = await masterChefV2.methods
            .userInfo(i, userAddress)
            .call();
          const rewards = await masterChefV2.methods
            .pendingCake(i, userAddress)
            .call();
          // check if the user has 0 amount for the current LP token
          if (userInfo.amount !== "0") {
           
          const reserve = await lpTokenContract.methods.getReserves().call();
          const token0dec = await lpTokenContract.methods.decimals().call();
          const token1dec = await lpTokenContract.methods.decimals().call();
          const totalSupply = await lpTokenContract.methods.totalSupply().call();

          const reserve0 = reserve._reserve0
          const reserve1 = reserve._reserve1

          const token0Amount = (((reserve0 * userInfo.amount) / totalSupply) / 10 ** token0dec).toFixed(2);
          const token1Amount = (((reserve1 * userInfo.amount) / totalSupply) / 10 ** token1dec).toFixed(2);

          console.log(`Token0 is ${token0symbol}: ${token0Amount}`);
          console.log(`Token1 is ${token1symbol}: ${token1Amount}`);
          console.log(`Rewards is ${rewards/10 ** token1dec}`)
           
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

getUserActivity("0xd183f2bbf8b28d9fec8367cb06fe72b88778c86b");
