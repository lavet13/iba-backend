import gql from 'graphql-tag';

export default gql`
  type Query {
    wbOrders(input: WbOrdersInput!): WbOrdersResponse!
    wbOrderById(id: BigInt!): WbOrder
    searchWbOrders(input: SearchWbOrdersInput!): WbOrdersResponse!
  }

  type Mutation {
    saveWbOrder(input: WbOrderInput!): WbOrder!
    updateWbOrder(input: UpdateWbInput!): WbOrder!
  }

  type Subscription {
    newWbOrder: WbOrder!
  }

  input UpdateWbInput {
    id: BigInt!
    status: OrderStatus!
    name: String!
    phone: String!
    qrCode: String
    orderCode: String
    wbPhone: String
    createdAt: Date!
    updatedAt: Date!
  }

  input WbOrdersInput {
    take: Int
    after: BigInt
    before: BigInt
    status: OrderStatus

    query: String!
    searchType: [SearchTypeWbOrders!]!
  }

  input SearchWbOrdersInput {
    query: String!
    take: Int
    after: BigInt
    before: BigInt
    searchType: SearchTypeWbOrders!
  }

  enum SearchTypeWbOrders {
    ID
    WB_PHONE
    PHONE
    NAME
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
    qrCodeFile: File
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
