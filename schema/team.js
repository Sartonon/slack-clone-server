export default `
  type Team {
    id: Int!
    name: String!
    owner: User!
    members: [User!]!
    channels: [Channel!]!
  }

  type TeamResponse {
    ok: Boolean!
    team: Team!
    errors: [Error!]
  }

  type Query {
    allTeams: [Team!]
  }
  
  type Mutation {
    createTeam(name: String!): TeamResponse!
  }
`;
