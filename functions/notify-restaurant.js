const { Logger, injectLambdaContext } = require('@aws-lambda-powertools/logger')
const logger = new Logger({ serviceName: process.env.serviceName })
const middy = require('@middy/core')

const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge')
const eventBridge = new EventBridgeClient()
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')
const sns = new SNSClient()

const busName = process.env.bus_name
const topicArn = process.env.restaurant_notification_topic

module.exports.handler = middy(async (event) => {
  logger.refreshSampleRateCalculation()
  const order = event.detail
  const publishCmd = new PublishCommand({
    Message: JSON.stringify(order),
    TopicArn: topicArn
  })
  await sns.send(publishCmd)

  const { restaurantName, orderId } = order
  logger.debug('notified restaurant', {restaurantName: restaurantName, orderId: orderId})

  const putEventsCmd = new PutEventsCommand({
    Entries: [{
      Source: 'big-mouth',
      DetailType: 'restaurant_notified',
      Detail: JSON.stringify(order),
      EventBusName: busName
    }]
  })
  await eventBridge.send(putEventsCmd)

  console.log(`published 'restaurant_notified' event to EventBridge`)
  logger.debug('published event to EventBridge', {eventType: 'restaurant_notified', busName})

}).use(injectLambdaContext(logger))
