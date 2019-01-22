export default `
  type Team {
    id: Int!
    name: String!
    owner: Int!
    members: [User!]!
    channels: [Channel!]!
  }

  type TeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type Query {
    allTeams: [Team!]
    inviteTeams: [Team!]!
  }

  type VoidResponse {
    ok: Boolean!
    errors: [Error!]
  }
  
  type Mutation {
    createTeam(name: String!): TeamResponse!
    addTeamMember(email: String!, teamId: Int!): VoidResponse!
  }
`;
