const axios = require("axios");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const { JSBI } = require("@uniswap/sdk");
const { ApolloServer, gql } = require("apollo-server");

const web3 = createAlchemyWeb3(
  "https://eth-mainnet.g.alchemy.com/v2/JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G"
);

// V3 pool abi json file
const IUniswapV3PoolABI = require("./V3PairAbi.json");

// V3 standard addresses
const NFTmanager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const { Network, Alchemy } = require("alchemy-sdk");

const settings = {
  apiKey: "JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const typeDefs = gql`
  type Query {
    getUserData(userAddress: String!): UserData
  }

  type UserData {
    tokenBalances: [Balance]
  }

  type Balance {
    token0: Token
    token1: Token
  }

  type Token {
    symbol: String
    amount: String
    reward: String
  }
`;

const resolvers = {
  Query: {
    async getUserData(_, { userAddress }) {
      try {
        const nftowner = await alchemy.nft.getNftsForOwner(`${userAddress}`);

        let tokenids = [];

        for (const nft of nftowner.ownedNfts) {
          if (nft.contract.address === NFTmanager.toLocaleLowerCase()) {
            const tokenId = nft.tokenId;
            tokenids.push(parseInt(tokenId));
          }
        }
        const tokenBalances = [];
        for (const tokens of tokenids) {
          const positions = await axios.post(
            "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3",
            {
              query: `
                  {
                    position(id: ${tokens}) {
                      liquidity
                       token0 {symbol decimals}
                      token1 {symbol decimals}
                      pool {feeGrowthGlobal0X128 feeGrowthGlobal1X128 id}
                      feeGrowthInside0LastX128
                      feeGrowthInside1LastX128
                      tickLower {feeGrowthOutside0X128 feeGrowthOutside1X128 id} 
                      tickUpper {feeGrowthOutside0X128 feeGrowthOutside1X128 id} 
                      }
                    }`,
            }
          );
          const position = positions.data.data.position;

          let token0sym = position.token0.symbol;
          let token1sym = position.token1.symbol;
          let token0Decimal = position.token0.decimals;
          let token1Decimal = position.token1.decimals;

          let V3pool = position.pool.id;
          let poolContract = new web3.eth.Contract(IUniswapV3PoolABI, V3pool);
          let slot0 = await poolContract.methods.slot0().call();

          const feetoken0 = (
            (((position.pool.feeGrowthGlobal0X128 -
              position.tickLower.feeGrowthOutside0X128 -
              position.tickUpper.feeGrowthOutside0X128 -
              position.feeGrowthInside0LastX128) /
              2 ** 128) *
              position.liquidity) /
            (1 * 10 ** token0Decimal)
          ).toFixed(2);
          const feetoken1 = (
            (((position.pool.feeGrowthGlobal1X128 -
              position.tickLower.feeGrowthOutside1X128 -
              position.tickUpper.feeGrowthOutside1X128 -
              position.feeGrowthInside1LastX128) /
              2 ** 128) *
              position.liquidity) /
            (1 * 10 ** token1Decimal)
          ).toFixed(2);

          const sqrtPriceX96 = slot0.sqrtPriceX96.toString();
          const tickLow = position.tickLower.id.substring(43);
          const tickHigh = position.tickUpper.id.substring(43);
          const liquidity = position.liquidity;

          const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));

          const getTickAtSqrtRatio = (sqrtPriceX96) =>
            Math.floor(Math.log((sqrtPriceX96 / Q96) ** 2) / Math.log(1.0001));

          let sqrtRatioA = Math.sqrt(1.0001 ** tickLow);
          let sqrtRatioB = Math.sqrt(1.0001 ** tickHigh);

          let currentTick = getTickAtSqrtRatio(sqrtPriceX96);
          let sqrtPrice = sqrtPriceX96 / Q96;
          let amount0wei = 0;
          let amount1wei = 0;
          if (currentTick <= tickLow) {
            amount0wei = Math.floor(
              liquidity *
                ((sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB))
            );
          } else if (currentTick > tickHigh) {
            amount1wei = Math.floor(liquidity * (sqrtRatioB - sqrtRatioA));
          } else if (currentTick >= tickLow && currentTick < tickHigh) {
            amount0wei = Math.floor(
              liquidity * ((sqrtRatioB - sqrtPrice) / (sqrtPrice * sqrtRatioB))
            );
            amount1wei = Math.floor(liquidity * (sqrtPrice - sqrtRatioA));
          }

          let amount0Human = (amount0wei / 10 ** token0Decimal).toFixed(2);
          let amount1Human = (amount1wei / 10 ** token1Decimal).toFixed(2);

          if (amount0wei !== 0) {
            tokenBalances.push({
              token0: {
                symbol: token0sym,
                amount: amount0Human,
                reward: feetoken0,
              },
              token1: {
                symbol: token1sym,
                amount: amount1Human,
                reward: feetoken1,
              },
            });
          }
        }

        return { tokenBalances };
      } catch (error) {
        console.error(error);
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
