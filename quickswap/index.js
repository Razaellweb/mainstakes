const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Web3 = require("web3");

const { ApolloServer, gql } = require("apollo-server");
// http provider configuration

const { Network, Alchemy } = require("alchemy-sdk");

const settings = {
  apiKey: "JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G",
  network: Network.ETH_MAINNET,
};

const web3 = new Alchemy(settings);

// abi of pancakeswap master chef contract
const sushiSwapMasterChefV2abi = require("./MasterChefV2.json");

// contract address of pancakeswap master chef contract
const quickSwapv2address =
  "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";

//  master chef contract
const masterChefV2 = new web3.eth.Contract(
  sushiSwapMasterChefV2abi,
  quickSwapv2address
);

// abi of tokenpair contract
const quickswapLpToken = require("./quickswaplptoken.json");
const tokenabi = require("./token.json");

const typeDefs = gql`
  type Query {
    getUserActivity(userAddress: String!): UserData
  }

  type UserData {
    pools: [Pool]
  }

  type Pool {
    rewards: String
    token0: Token
    token1: Token
  }

  type Token {
    symbol: String
    address: String
    amount: String
  }
`;

const resolvers = {
  Query: {
    async getUserActivity(_, { userAddress }) {
      try {
        const poolLength = await masterChefV2.methods.poolLength().call();
        const pools = [];
        // loop through all pool IDs
        for (let i = 0; i <= poolLength; i++) {
          const lpTokenAddress = await masterChefV2.methods.lpToken(i).call();
          // get the user's information for the current LP token
          const userInfo = await masterChefV2.methods
            .userInfo(i, userAddress)
            .call();
          //rewards
          const rewards = await masterChefV2.methods
            .pendingSushi(i, userAddress)
            .call();
          // check if the user has a non-zero amount
          

          if (userInfo.amount > 0) {
            const lpamount =  userInfo.amount;
            // create an instance of the lp contract
            const lp = new web3.eth.Contract(quickswapLpToken, lpTokenAddress);
            // call the main function to get the token pair information
            const { token0, token1 } = await main(lp, lpamount);
            pools.push({
              amount: userInfo.amount,
              rewards,

              token0,
              token1,
            });
          }
        }
        return { pools };
      } catch (error) {
        console.log(error);
      }
    },
  },
};

async function main(lp, lpamount) {
  const token0Address = await lp.methods.token0().call();
  const token1Address = await lp.methods.token1().call();

  const token0Contract = new web3.eth.Contract(tokenabi, token0Address);
  const token1Contract = new web3.eth.Contract(tokenabi, token1Address);

  const token0Symbol = await token0Contract.methods.symbol().call();
  const token1Symbol = await token1Contract.methods.symbol().call();

  const token0dec = await lp.methods.decimals().call();
  const token1dec = await lp.methods.decimals().call();
  const totalSupply = await lp.methods.totalSupply().call();
  const reserve = await lp.methods.getReserves().call();

  const reserve0 = reserve._reserve0;
  const reserve1 = reserve._reserve1;

  const token0Amount = (
    (reserve0 * lpamount) /
    totalSupply /
    10 ** token0dec
  ).toFixed(2);
  const token1Amount = (
    (reserve1 * lpamount) /
    totalSupply /
    10 ** token1dec
  ).toFixed(2);

  return {
    token0: {
      amount: token0Amount,
      symbol: token0Symbol,
      address: token0Address,
    },
    token1: {
      amount: token1Amount,
      symbol: token1Symbol,
      address: token1Address,
    },
  };
}

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
