const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const Web3 = require("web3");
const { ApolloServer, gql } = require("apollo-server");
// http provider configuration

const web3 = createAlchemyWeb3(
    "https://eth-mainnet.g.alchemy.com/v2/JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G"
);
// abi of pancakeswap master chef contract
const sushiSwapMasterChefV2abi = require("./MasterChefV2.json");

// contract address of pancakeswap master chef contract
const sushiSwapMasterChefV2address =
    "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd";
//  master chef contract
const mainStacking = new web3.eth.Contract(
    sushiSwapMasterChefV2abi,
    sushiSwapMasterChefV2address
);

// abi of tokenpair contract
const SushiSwapLPToken = require("./SushiSwapLPToken.json");
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
            const poolLength = await mainStacking.methods;
            const pools = [];
            try {
                const poolLength = await mainStacking.methods.poolLength().call();
                const pools = [];
                // loop through all pool IDs
                for (let i of Array(poolLength).keys()) {                    const lpTokenAddres = await mainStacking.methods.poolInfo(i).call();
                    const lpTokenAddress = lpTokenAddres.lpToken
                    // get the user's information for the current LP token
                    const userInfo = await mainStacking.methods
                        .userInfo(i, userAddress)
                        .call();
                    //rewards
                    const rewards = await mainStacking.methods
                        .pendingSushi(i, userAddress)
                        .call();
                    // check if the user has a non-zero amount
                    if (userInfo.amount > 0) {
                        const lpamount = userInfo.amount;
                        // create an instance of the lp contract
                        const lp = new web3.eth.Contract(SushiSwapLPToken, lpTokenAddress);

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
                    }
                }
                return { pools }
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
