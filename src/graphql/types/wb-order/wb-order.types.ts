import gql from 'graphql-tag';

export default gql`
  type Query {
    wbOrderById(id: ID!): WbOrder
  }

  type Mutation {
    saveWbOrder(input: WbOrderInput!): Boolean!
  }

  input WbOrderInput {
    FLP: String!
    QR: File
    orderCode: String
    phone: String!
    wbPhone: String
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
