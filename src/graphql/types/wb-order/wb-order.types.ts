import gql from 'graphql-tag';

export default gql`
  type Query {
    wbOrders(input: WbOrdersInput!): WbOrdersResponse!
    wbOrderById(id: BigInt!): WbOrder
  }

  type Mutation {
    saveWbOrder(input: WbOrderInput!): Boolean!
    updateWbOrder(input: UpdateWbInput!): WbOrder!
  }

  input UpdateWbInput {
    id: BigInt!
    status: OrderStatus!
  }

  input WbOrdersInput {
    take: Int
    after: BigInt
    before: BigInt
  }

  type PageInfo {
    startCursor: BigInt
    endCursor: BigInt
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type WbOrdersResponse {
    edges: [WbOrder!]!
    pageInfo: PageInfo!
  }


  input WbOrderInput {
    FLP: String!
    QR: File
    orderCode: String
    phone: String!
    wbPhone: String
  }

  type WbOrder {
    id: BigInt!
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
    NOT_ASSEMBLED
    ASSEMBLED
    REJECTED
  }
`;
