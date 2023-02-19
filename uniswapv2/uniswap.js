const { ApolloServer, gql } = require("apollo-server");
const axios = require("axios");

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
  }
`;

const resolvers = {
  Query: {
    async getUserData(_, { userAddress }) {
      try {
        // Make a request to the The Graph API to get the user's liquidity positions data
        const response = await axios.post(
          "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
          {
            query: `{
              user(id: "${userAddress}") {
                liquidityPositions {
                  pair {
                    id
                    reserve1
                    reserve0
                    token0 {
                      symbol
                      id
                    }
                    token1 {
                      symbol
                      id
                    }
                    totalSupply
                  }
                  liquidityTokenBalance
                }
              }
            }`,
          }
        );

        // Get the liquidity positions data
        const liquidityPositions = response.data.data.user.liquidityPositions;
        const tokenBalances = [];

        // Loop through each liquidity position
        for (const position of liquidityPositions) {
          // If the user has a non-zero balance in the liquidity token
          if (position.liquidityTokenBalance !== "0") {
            const token0Amount = ((position.pair.reserve0 * position.liquidityTokenBalance) / position.pair.totalSupply).toFixed(2);
            const token1Amount = ((position.pair.reserve1 * position.liquidityTokenBalance) / position.pair.totalSupply).toFixed(2);
            // Log the transaction data to the console
            tokenBalances.push({
              token0: {
                symbol: position.pair.token0.symbol,
                amount: token0Amount,
              },
              token1: {
                symbol: position.pair.token1.symbol,
                amount: token1Amount,
              },
            });
          }
        }

        return { tokenBalances };
      } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve user data.");
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
