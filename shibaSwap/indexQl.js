const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const { ApolloServer, gql } = require("apollo-server");

const web3 = createAlchemyWeb3(process.env.URL);

// abi of pancakeswap master chef contract
const ShibaSwapMainstakingabi = require("./Mainstaking.json");

// contract address of pancakeswap master chef contract
const ShibaSwapMainstakingaddress =
  "0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d";

//  master chef contract
const mainstaking = new web3.eth.Contract(
  ShibaSwapMainstakingabi,
  ShibaSwapMainstakingaddress
);

// abi of tokenpair contract
const ShibaSwapLPToken = require("./ShibaSwapLPToken.json");
const tokenabi = require("./token.json");

const typeDefs = gql`
  type Query {
    getUserActivity(userAddress: String!): UserData
  }

  type UserData {
    pools: [Pool]
  }

  type Pool {
    poolAddress: String
    poolId: Int
    amount: String
    rewards: String
    pairAddress: String
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
        const poolLength = await mainstaking.methods.poolLength().call();
        const pools = [];
        // loop through all pool IDs
        for (let i = 0; i <= poolLength; i++) {
          const lpTokenAddress = await mainstaking.methods.poolInfo(i).call();
          // get the user's information for the current LP token
          const userInfo = await mainstaking.methods
            .userInfo(i, userAddress)
            .call();
          //rewards
          const rewards = await mainstaking.methods
            .pendingBone(i, userAddress)
            .call();
          // check if the user has a non-zero amount

          if (userInfo.amount > 0) {
            const lpamount = userInfo.amount;
            // create an instance of the lp contract
            const lp = new web3.eth.Contract(ShibaSwapLPToken, lpTokenAddress.lpToken);
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
              poolAddress: lpTokenAddress.lpToken,
              poolId: i,
              amount: userInfo.amount,
              rewards,
              pairAddress: lpTokenAddress,
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
            return { pools };
          }
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
