import gql from 'graphql-tag';

export default gql`
  type Mutation {
    saveQR(file: File!): Boolean!
  }

  type WbOrder {
    id: ID!
    name: String!
    phone: String!
    qrCode: String
    orderCode: String
    wbPhone: String
    status: OrderStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  enum OrderStatus {
    PENDING
    PAID
    CANCELLED
  }
`;
