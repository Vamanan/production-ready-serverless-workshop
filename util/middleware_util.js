const { Logger, injectLambdaContext } = require('@aws-lambda-powertools/logger')
const logger = new Logger({ serviceName: process.env.serviceName })

const middy = require('@middy/core')
const ssm = require('@middy/ssm')
const middyCacheEnabled = JSON.parse(process.env.middy_cache_enabled)
const middyCacheExpiry = parseInt(process.env.middy_cache_expiry_milliseconds)
const { serviceName, ssmStage } = process.env

module.exports = f => {
    return middy(f).use(ssm({
        cache: middyCacheEnabled,
        cacheExpiry: middyCacheExpiry,
        setToContext: true,
        fetchData: {
          config: `/${serviceName}/${ssmStage}/search-restaurants/config`,
          secretString: `/${serviceName}/${ssmStage}/search-restaurants/secretString`
        }
      })).use(injectLambdaContext(logger))
}
  