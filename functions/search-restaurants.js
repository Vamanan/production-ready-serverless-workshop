const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb")
const middleware = require('../util/middleware_util')

const dynamodb = new DynamoDB()

const { serviceName, ssmStage } = process.env

const tableName = process.env.restaurants_table

const findRestaurantsByTheme = async (theme, count) => {
  console.log(`finding (up to ${count}) restaurants with the theme ${theme}...`)
  const req = {
    TableName: tableName,
    Limit: count,
    FilterExpression: "contains(themes, :theme)",
    ExpressionAttributeValues: marshall({ ":theme": theme })
  }

  const resp = await dynamodb.scan(req)
  console.log(`found ${resp.Items.length} restaurants`)
  return resp.Items.map(x => unmarshall(x))
}

module.exports.handler = middleware(
  async (event, context) => {
    const req = JSON.parse(event.body)
    const theme = req.theme
    const restaurants = await findRestaurantsByTheme(theme, context.config.defaultResults)
    const response = {
      statusCode: 200,
      body: JSON.stringify(restaurants)
    }
  
    return response
  }
)
