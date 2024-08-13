import gql from 'graphql-tag';

export default gql`
  type Query {
    me: User
  }

  input LoginInput {
    login: String!
    password: String!
  }

  input SignupInput {
    email: String!
    name: String!
    password: String!
  }

  type Mutation {
    login(loginInput: LoginInput!): AuthPayload!
    signup(signupInput: SignupInput!): AuthPayload!
    logout: Boolean!
    refreshToken: AuthPayload!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    roles: [Role!]!
  }

  enum Role {
    USER
    ADMIN
    MANAGER
  }
`;
