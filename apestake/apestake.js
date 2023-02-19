const { ApolloServer, gql } = require("apollo-server");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const web3 = createAlchemyWeb3(
  "https://eth-mainnet.g.alchemy.com/v2/JOHdJUN4I8RqCltE8B7e5BQBtucmGX0G"
);
const contractAddress = "0x5954aB967Bc958940b7EB73ee84797Dc8a2AFbb9";
const apeabi = require("./ape.json");
const contract = new web3.eth.Contract(apeabi, contractAddress);

const symbols = ["ApeCoin", "BAYC", "MAYC", "BAKC"];

const typeDefs = gql`
  type Stake {
    symbol: String!
    deposited: Float!
    rewards: Float!
  }

  type Query {
    getAllStakes(address: String!): [Stake]
  }
`;

const resolvers = {
  Query: {
    async getAllStakes(root, { address }) {
      const allStakes = await contract.methods.getAllStakes(address).call();
      const stakes = allStakes
        .filter((stake) => stake[2] !== "0")
        .map((stake) => ({
          symbol: symbols[stake[0]],
          deposited: stake[2] / 1e18,
          rewards: stake[3] / 1e18,
        }));
      return stakes;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

