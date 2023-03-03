const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Web3 = require("web3");


const { ApolloServer, gql } = require("apollo-server");
// http provider configuration

const url =
    "https://bold-black-energy.bsc.discover.quiknode.pro/c2bf115e5d95e1ee7a40bef1eb2e9bef41222bfb/";
const web3 = new Web3(new Web3.providers.HttpProvider(url));

// abi of apeswap master chef contract
const apeswapV2abi = require("./MasterChefV2.json");

// contract address of apeswap master chef contract
const apeswapV2address =
  "0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95";

//  master chef contract
const masterChefV2 = new web3.eth.Contract(
  apeswapV2abi,
  apeswapV2address
);

// abi of tokenpair contract
const apeSwapLPToken = require("./apeswap.json");
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
    amount: Int
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
          const lpTokenAddress = await masterChefV2.methods.getPoolInfo(i).call();
          // get the user's information for the current LP token
          const userInfo = await masterChefV2.methods
            .userInfo(i, userAddress)
            .call();
          //rewards
          const rewards = await masterChefV2.methods
            .pendingCake(i, userAddress)
            .call();
          // check if the user has a non-zero amount

          if (userInfo.amount > 0) {
            // create an instance of the lp contract
            const lpamount = userInfo.amount
            const lp = new web3.eth.Contract(apeSwapLPToken, lpTokenAddress.lpToken);
            // call the main function to get the token pair information
            const token0Address = await lp.methods.token0().call();
            const token1Address = await lp.methods.token1().call();

            const token0Contract = new web3.eth.Contract(tokenabi, token0Address);
            const token1Contract = new web3.eth.Contract(tokenabi, token1Address);

            const token0Symbol = await token0Contract.methods.symbol().call();
            const token1Symbol = await token1Contract.methods.symbol().call();

            const token0dec = await token0Contract.methods.decimals().call();
            const token1dec = await token1Contract.methods.decimals().call();
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

            pools.push({
              rewards: rewards / 10 ** token0dec,
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
            });
            return { pools }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
